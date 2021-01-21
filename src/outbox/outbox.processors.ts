import { Injectable } from '@nestjs/common';
import { Outbox } from '@prisma/client';
import { NotificationsQueueClient } from 'src/notifications/notifications.queue.client';
import { SagaQueueClient } from 'src/sagas/queue/saga.queue.client';
import { OutboxTyped, OutboxTypes } from './outbox.types';

interface OutboxProcessor {
  process(outbox: Outbox): Promise<void>;
}

@Injectable()
export class OutboxSagaProcessor implements OutboxProcessor {
  constructor(private queue: SagaQueueClient) {}

  async process(outbox: Outbox): Promise<void> {
    const { value } = <OutboxTyped<'outbox:saga'>>outbox.content;

    await this.queue.send({
      sagaId: value.sagaId,
      type: value.sagaType,
    });
  }
}

@Injectable()
export class NotificationsProcessor implements OutboxProcessor {
  constructor(private queue: NotificationsQueueClient) {}

  async process(outbox: Outbox): Promise<void> {
    const { value } = <OutboxTyped<'outbox:notification'>>(
      (<unknown>outbox.content)
    );

    await this.queue.send({
      chatId: value.chatId,
      text: value.text,
      markup: value.markup,
    });
  }
}

@Injectable()
export class OutboxProcessorResolver {
  constructor(
    private readonly sagaProcessor: OutboxSagaProcessor,
    private readonly notificationProcessor: NotificationsProcessor,
  ) {}

  resolve(type: OutboxTypes): OutboxProcessor {
    switch (type) {
      case 'outbox:saga':
        return this.sagaProcessor;

      case 'outbox:notification':
        return this.notificationProcessor;

      default:
        throw new Error(`Unsupported outbox type '${type}'`);
    }
  }
}
