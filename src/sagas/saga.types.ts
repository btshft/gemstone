import { Job } from 'bull';
import { Drop } from 'src/utils/utility.types';
import {
  FollowersInsightSaga,
  FollowersInsightSagaMetadata,
  FollowersInsightSagaStates,
  FollowersInsightSagaType,
} from './insight/followers/saga.insight-followers';
import {
  RequestStoriesSaga,
  RequestStoriesSagaMetadata,
  RequestStoriesSagaStates,
  RequestStoriesSagaType,
} from './stories/request/saga.request-stories';
import { TtSaga, TtSagaMetadata, TtSagaStates, TtSagaType } from './tt/saga.tt';

export const SAGA_PROCESS_REQUEST = 'saga:process';

export type AnySaga = RequestStoriesSaga | FollowersInsightSaga | TtSaga;
export type SagaTypes =
  | RequestStoriesSagaType
  | FollowersInsightSagaType
  | TtSagaType;

export type SagaType<TType extends SagaTypes> = TType;
export type SagaState<TSaga extends AnySaga> = TSaga['state'];
export type SagaTypeBySaga<TSaga extends AnySaga> = TSaga['type'];
export type SagaMetadata<
  TSaga extends AnySaga,
  TState extends SagaState<TSaga>
> = TState extends RequestStoriesSagaStates
  ? RequestStoriesSagaMetadata[TState]
  : TState extends FollowersInsightSagaStates
  ? FollowersInsightSagaMetadata[TState]
  : TState extends TtSagaStates
  ? TtSagaMetadata[TState]
  : never;

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
