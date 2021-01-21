import { ExtraEditMessage } from 'telegraf/typings/telegram-types';

export const NOTIFICATIONS_QUEUE_NAME = 'queue:notifications';
export const NOTIFICATIONS_QUEUE_REPROCESS_ATTEMPTS = 3;
export const NOTIFICATIONS_QUEUE_REPROCESS_DELAY_MS = 15000;

export type UserNotification = {
  text: string;
  chatId: string | number;
  markup?: ExtraEditMessage;
};
