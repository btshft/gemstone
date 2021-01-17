import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Outbox } from '@prisma/client';
import { th } from 'date-fns/locale';
import { IgService } from 'src/ig/ig.service';
import { OutboxWriter } from 'src/outbox/outbox.writer';
import { S3 } from 'src/s3/s3';
import { iterator } from 'src/utils/observable.async-iterator';
import { ACTIONS_QUEUE } from './actions.queue.constants';
import { ActionJob, ACTION_REQUEST_STORIES } from '../actions.types';

@Processor(ACTIONS_QUEUE)
export class ActionsQueueProcessor {
  private readonly logger = new Logger('Queue[Task]');

  constructor(
    private ig: IgService,
    private outbox: OutboxWriter,
    private s3: S3,
  ) {}

  @Process(ACTION_REQUEST_STORIES)
  async stories(job: ActionJob<'action:request-stories'>) {
    try {
      const { ig } = job.data;
      const stories$ = this.ig.stories$(ig.userId);

      for await (const stories of iterator(stories$)) {
        for (const story of stories) {
          this.logger.log(story);
        }
      }
    } catch (err) {
      this.logger.error({
        message: 'Failed to load stories',
        error: err.message || err,
      });
    }
  }
}
