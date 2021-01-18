import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from 'src/database/services/prisma';
import { ResourceLock } from 'src/utils/resource-locker';
import { OutboxProcessorResolver } from './outbox.processors';
import { OutboxUnknown } from './outbox.types';

@Injectable()
export class OutboxScheduler {
  private readonly locker = new ResourceLock();
  private readonly logger = new Logger('Outbox');

  constructor(
    private prisma: Prisma,
    private resolve: OutboxProcessorResolver,
  ) {}

  @Cron('*/10 * * * * *')
  async process(): Promise<void> {
    try {
      const outboxes = await this.prisma.outbox.findMany({
        where: {
          content: {
            not: undefined,
          },
        },
      });

      for (const outbox of outboxes) {
        const lock = await this.locker.acquire(outbox.id);

        try {
          const existing = await this.prisma.outbox.findUnique({
            where: {
              id: outbox.id,
            },
            select: {
              id: true,
            },
          });

          if (!existing) {
            // Skip because someone already processed outbox
            continue;
          }

          const unknown = <OutboxUnknown>outbox.content;
          const handler = this.resolve.resolve(unknown.type);

          await handler.process(outbox);
          await this.prisma.outbox.delete({
            where: {
              id: outbox.id,
            },
          });
        } catch (err) {
          this.logger.error({
            message: `Failed to process outbox '${outbox.id}'`,
            reason: err.message || err,
          });
        } finally {
          await lock.release();
        }
      }
    } catch (err) {
      this.logger.error({
        message: `Failed to process outboxes`,
        reason: err.message || err,
      });
    }
  }
}
