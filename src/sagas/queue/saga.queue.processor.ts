import { Process, Processor } from '@nestjs/bull';
import { ResourceLock } from 'src/utils/resource-locker';
import { SAGA_QUEUE_NAME } from './saga.queue.constants';
import { SagaJob, SagaTypes, SAGA_PROCESS_REQUEST } from '../saga.types';
import { SagaHandlerResolver } from './saga.queue.handler.resolver';
import { SagaService } from '../saga.service';
import { Prisma } from 'src/database/services/prisma';
import { Logger } from '@nestjs/common';
import { OutboxWriter } from 'src/outbox/outbox.writer';
import { Saga } from '@prisma/client';
import { RequestStoriesSaga } from '../stories/request/saga.request-stories';
import { FollowersInsightSaga } from '../insight/followers/saga.insight-followers';

@Processor(SAGA_QUEUE_NAME)
export class SagaQueueProcessor {
  private readonly lock: ResourceLock = new ResourceLock();
  private readonly logger = new Logger(SagaQueueProcessor.name);

  constructor(
    private resolver: SagaHandlerResolver,
    private sagaService: SagaService,
    private prisma: Prisma,
    private outbox: OutboxWriter,
  ) {}

  @Process(SAGA_PROCESS_REQUEST)
  async stories(job: SagaJob<SagaTypes>): Promise<void> {
    if (job.failedReason) {
      throw new Error(
        `Job ${job.name} of queue ${job.queue} failed with reason ${job.failedReason}`,
      );
    }

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
      //
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

      await this.tryReportFailure(saga);
    } finally {
      await lock.release();
    }
  }

  private async tryReportFailure(saga: Saga): Promise<void> {
    try {
      const type = <SagaTypes>saga.type;
      if (type === 'saga:stories:request') {
        const storiesSaga = <RequestStoriesSaga>saga;
        if (storiesSaga.metadata) {
          await this.outbox.write<'outbox:notification'>({
            type: 'outbox:notification',
            value: {
              chatId: storiesSaga.metadata.tgChatId,
              text: `I failed to get @${storiesSaga.metadata.igUsername} stories due to an error 😥`,
            },
          });
        }
      }

      if (type === 'saga:insight:followers') {
        const insightSaga = <FollowersInsightSaga>saga;
        if (insightSaga.metadata) {
          await this.outbox.write<'outbox:notification'>({
            type: 'outbox:notification',
            value: {
              chatId: insightSaga.metadata.tgChatId,
              text: `I failed to generate followers insight for @${insightSaga.metadata.igUsername} due to an error 😥`,
            },
          });
        }
      }
    } catch (err) {
      this.logger.error({
        message: 'Unable to notify about failure',
        reason: err.message || JSON.stringify(err),
        saga_id: saga?.id,
      });
    }
  }
}
