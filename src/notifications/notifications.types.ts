import { Notification } from '@prisma/client';
import { Drop, TObject } from 'src/utils/utility.types';

type _Notifications = {
  'stories:request:ready': TObject;
};

export type UserNotification<T extends keyof _Notifications = any> = Drop<
  Notification,
  'metadata'
> & {
  metadata: _Notifications[T];
};

export type NotificationTypes = keyof _Notifications;
export type CreateNotification<T extends keyof _Notifications = any> = Drop<
  UserNotification<T>,
  'createdAt' | 'id' | 'seen'
>;
