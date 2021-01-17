import { Job } from 'bull';

export const ACTION_REQUEST_STORIES = 'action:request-stories';

type _Action = {
  chat: {
    id: number | string;
  };
  from: {
    id: number | string;
  };
};

type _Actions = {
  [ACTION_REQUEST_STORIES]: _Action & {
    ig: {
      userId: number | string;
      username: string;
    };
  };
};

export type ActionTypes = keyof _Actions;
export type ActionType<TKey extends keyof _Actions> = TKey;
export type Action<T extends keyof _Actions> = {
  type: T;
  payload: _Actions[T];
};

export type ActionJob<TKey extends keyof _Actions> = Job<
  Action<TKey>['payload']
>;
