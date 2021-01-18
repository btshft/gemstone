import { Saga } from '@prisma/client';
import { Job } from 'bull';
import { ReelsMediaFeedResponseItem } from 'instagram-private-api';
import { Drop, TObject } from 'src/utils/utility.types';

export const SAGA_REQUEST_STORIES = 'saga:stories:request';

type _SagasCollection = {
  ['saga:stories:request']: {
    ['ig:get-json']: {
      igUserId: string | number;
      igUsername: string;
      tgChatId: string | number;
      userId: string;
    };
    ['s3:upload']: _SagasCollection['saga:stories:request']['ig:get-json'] & {
      stories: ReelsMediaFeedResponseItem[];
    };
    ['tg:send']: _SagasCollection['saga:stories:request']['ig:get-json'] & {
      bucket: string;
      keys: string[];
    };
  };
};

export type SagaTypes = keyof _SagasCollection;
export type SagaType<TType extends SagaTypes> = TType;
export type SagaStates<TType extends SagaTypes> = keyof _SagasCollection[TType];

export type StoriesSagaState = keyof _SagasCollection['saga:stories:request'];

type _BuildStoriesSaga<
  TState extends StoriesSagaState,
  TMetadata extends TObject
> = Drop<Saga, 'metadata' | 'type' | 'state'> & {
  state: TState;
  type: SagaType<'saga:stories:request'>;
  metadata: TMetadata;
};

// eslint-disable-next-line prettier/prettier
export type StoriesSagaGetJson = _BuildStoriesSaga<'ig:get-json',
  {
    igUserId: string | number;
    igUsername: string;
    tgChatId: string | number;
    userId: string;
  }
>;

// eslint-disable-next-line prettier/prettier
export type StoriesSagaS3Upload = _BuildStoriesSaga<'s3:upload', {
    stories: ReelsMediaFeedResponseItem[];
  } & StoriesSagaGetJson['metadata']
>;

// eslint-disable-next-line prettier/prettier
export type StoriesSagaTgSend = _BuildStoriesSaga<'tg:send', {
    bucket: string;
    keys: string[];
  } & StoriesSagaGetJson['metadata']
>;

export type StoriesSaga =
  | StoriesSagaGetJson
  | StoriesSagaS3Upload
  | StoriesSagaTgSend;

export type AnySaga = Drop<StoriesSaga, 'metadata'> & {
  metadata: Record<string, any>;
};

export type SagaState<TSaga extends AnySaga> = TSaga['state'];
export type SagaTypeBySaga<TSaga extends AnySaga> = TSaga['type'];
export type SagaMetadata<
  TSaga extends AnySaga,
  TState extends SagaState<TSaga>
> = _SagasCollection[SagaTypeBySaga<TSaga>][TState];

export type SagaCreate<TType extends AnySaga> = Drop<
  TType,
  'createdAt' | 'fault' | 'faultedAt' | 'completedAt' | 'id' | 'transitionAt'
>;

export type SagaUpdate<TType extends AnySaga> = Drop<TType, 'id'>;
export type SagaJobPayload<TType extends SagaTypes> = {
  type: TType;
  sagaId: string;
};

export type SagaJob<TType extends SagaTypes> = Job<SagaJobPayload<TType>>;

export interface SagaHandler<TSaga extends AnySaga> {
  handle(saga: TSaga): Promise<void>;
}