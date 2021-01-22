import { Saga } from '@prisma/client';
import {
  AccountFollowersFeedResponseUsersItem,
  AccountFollowingFeedResponseUsersItem,
} from 'instagram-private-api';
import { Drop } from 'src/utils/utility.types';

type _States = {
  ['saga:insight:followers']: FollowersInsightSagaMetadata;
};

type _Type<TKey extends keyof _States> = TKey;
type _BuildInsightFollowersSaga<
  TState extends FollowersInsightSagaStates
> = Drop<Saga, 'metadata' | 'type' | 'state'> & {
  state: TState;
  type: _Type<'saga:insight:followers'>;
  metadata: _States['saga:insight:followers'][TState];
};

export type FollowersInsightSagaMetadata = {
  ['ig:followers:get']: {
    igUserId: string | number;
    igUsername: string;
    tgChatId: string | number;
    userId: string;
  };
  ['insight:followers:generate']: _States['saga:insight:followers']['ig:followers:get'] & {
    followers: AccountFollowersFeedResponseUsersItem[];
    following: AccountFollowingFeedResponseUsersItem[];
    drift: boolean;
  };
  ['insight:followers:send']: _States['saga:insight:followers']['ig:followers:get'] & {
    insightId: string;
  };
};

export type FollowersInsightSagaStates = keyof _States['saga:insight:followers'];
export type FollowersInsightSagaType = keyof _States;

// eslint-disable-next-line prettier/prettier
export type FollowersInsightSagaGetFollowers = _BuildInsightFollowersSaga<'ig:followers:get'>;

// eslint-disable-next-line prettier/prettier
export type FollowersInsightSagaGenerate = _BuildInsightFollowersSaga<'insight:followers:generate'>;

// eslint-disable-next-line prettier/prettier
export type FollowersInsightSagaSend = _BuildInsightFollowersSaga<'insight:followers:send'>;

export type FollowersInsightSaga =
  | FollowersInsightSagaGetFollowers
  | FollowersInsightSagaGenerate
  | FollowersInsightSagaSend;
