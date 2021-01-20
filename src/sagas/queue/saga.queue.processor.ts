import { Process, Processor } from '@nestjs/bull';
import { ResourceLock } from 'src/utils/resource-locker';
import { SAGA_QUEUE_NAME } from './saga.queue.constants';
import { SagaJob, SAGA_REQUEST_STORIES } from '../saga.types';
import { SagaHandlerResolver } from './saga.queue.handler.resolver';
import { SagaService } from '../saga.service';
import { Prisma } from 'src/database/services/prisma';
import { Logger } from '@nestjs/common';

@Processor(SAGA_QUEUE_NAME)
export class SagaQueueProcessor {
  private readonly lock: ResourceLock = new ResourceLock();
  private readonly logger = new Logger(SagaQueueProcessor.name);

  constructor(
    private resolver: SagaHandlerResolver,
    private sagaService: SagaService,
    private prisma: Prisma,
  ) {}

  @Process(SAGA_REQUEST_STORIES)
  async stories(job: SagaJob<'saga:stories:request'>): Promise<void> {
    const saga = await this.prisma.saga.findUnique({
      where: {
        id: job.data.sagaId,
      },
    });

    if (!saga || saga.completedAt || saga.faultedAt) {
      return;
    }

    const lock = await this.lock.acquire(saga.id);
    try {
      const handler = this.resolver.resolve(saga);
      await handler.handle(saga);

      const updatedSaga = await this.prisma.saga.findUnique({
        where: {
          id: job.data.sagaId,
        },
        select: {
          completedAt: true,
          faultedAt: true,
          state: true,
        },
      });

      // State not changed after processing, mistake probably
      if (updatedSaga.state === saga.state) {
        // Skip if state was final
        if (!updatedSaga.completedAt && !updatedSaga.faultedAt) {
          throw new Error(
            `Saga '${saga.id}' hanged. Make sure you changed state inside of handler`,
          );
        }
      }

      if (!updatedSaga.completedAt && !updatedSaga.faultedAt)
        await this.sagaService.process(saga.id);
    } catch (err) {
      this.logger.error({
        message: 'Saga failure',
        id: saga.id,
        reasong: err.message || JSON.stringify(err),
      });

      await this.sagaService.complete(
        saga.id,
        err.message || JSON.stringify(err),
      );
    } finally {
      await lock.release();
    }
  }
}
