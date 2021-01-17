import { Injectable } from '@nestjs/common';
import { Outbox } from '@prisma/client';
import { ActionsQueue } from 'src/actions/queue/actions.queue';
import { OutboxTyped, OutboxTypes } from './outbox.types';

interface OutboxProcessor {
  process(outbox: Outbox): Promise<void>;
}

@Injectable()
export class OutboxTaskProcessor implements OutboxProcessor {
  constructor(private queue: ActionsQueue) {}

  async process(outbox: Outbox): Promise<void> {
    const { value } = <OutboxTyped<'outbox:action'>>outbox.content;

    await this.queue.request({
      payload: value.action.payload,
      type: value.action.type,
    });
  }
}

@Injectable()
export class OutboxProcessorResolver {
  constructor(private taskProcessor: OutboxTaskProcessor) {}

  resolve(type: OutboxTypes): OutboxProcessor {
    switch (type) {
      case 'outbox:action':
        return this.taskProcessor;

      default:
        throw new Error(`Unsupported outbox type '${type}'`);
    }
  }
}
