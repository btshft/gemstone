export type StoriesRequest = {
  ig: {
    userId: number;
    username: string;
  };
  tg: {
    chatId: number;
    userId: number;
  };
};
