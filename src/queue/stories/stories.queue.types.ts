import { Task } from 'src/tasks/task.store';

export const STORIES_REQ = 'stories:request';

export type LoadStoriesRequest = {
  ig: {
    userId: number;
    username: string;
  };
  tg: {
    chatId: number;
    userId: number;
  };
};

export type StoriesTaskStatus =
  | 'created'
  | 'downloading'
  | 'uploading'
  | 'done'
  | 'error';

type StoriesTaskTypes = {
  [STORIES_REQ]: {
    request: LoadStoriesRequest;
    job: {
      id: number | string;
    };
  };
};

export type StoriesTask<TKey extends keyof StoriesTaskTypes> = Task<
  StoriesTaskTypes[TKey],
  StoriesTaskStatus
>;
