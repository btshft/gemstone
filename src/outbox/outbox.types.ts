import { SagaTypes } from 'src/sagas/saga.types';
import { ExtraEditMessageText } from 'telegraf/typings/telegram-types';

type Empty = Record<string, any>;
type Outboxes = {
  ['outbox:saga']: {
    value: {
      sagaId: string;
      sagaType: SagaTypes;
    };
    metadata: Empty;
  };
  ['outbox:notification']: {
    value: {
      text: string;
      chatId: string | number;
      markup?: ExtraEditMessageText;
    };
    metadata: Empty;
  };
};

export type OutboxTyped<TKey extends keyof Outboxes> = {
  type: TKey;
  value: Outboxes[TKey]['value'];
};

export type OutboxMetadata<
  TKey extends keyof Outboxes
> = Outboxes[TKey]['metadata'];

export type OutboxUnknown = {
  type: keyof Outboxes;
};

export type OutboxTypes = keyof Outboxes;
