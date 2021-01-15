import { Job } from 'bull';

export const CALLBACK_STORIES_REQ_READY = 'stories:req:ready';
export const CALLBACK_STORIES_REQ_FAILED = 'stories:req:failed';

type _Callback = {
  chat: {
    id: number;
  };
  from: {
    id: number;
  };
  source: {
    job: number | string;
  };
};

export type Callbacks = {
  [CALLBACK_STORIES_REQ_READY]: _Callback & {
    files: {
      bucket: string;
      keys: string[];
    };
  };

  [CALLBACK_STORIES_REQ_FAILED]: _Callback & {
    error: any;
  };
};

export type CallbackType<TKey extends keyof Callbacks> = TKey;
export type Callback<T extends keyof Callbacks> = {
  type: T;
  payload: Callbacks[T];
};

export type CallbackJob<TKey extends keyof Callbacks> = Job<Callback<TKey>>;
