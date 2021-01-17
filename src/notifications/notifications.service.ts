import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/database/services/prisma';
import {
  CreateNotification,
  NotificationTypes,
  UserNotification,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: Prisma) {}

  async complete(id: string): Promise<void> {
    await this.prisma.notification.update({
      data: {
        seen: true,
      },
      where: {
        id: id,
      },
    });
  }

  async create<TKey extends NotificationTypes>(
    model: CreateNotification<TKey>,
  ): Promise<string> {
    const { id } = await this.prisma.notification.create({
      data: {
        text: model.text,
        user: {
          connect: {
            id: model.userId,
          },
        },
        metadata: model.metadata,
        seen: false,
      },
    });

    return id;
  }

  async userNotifications(userId: string): Promise<UserNotification<any>[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: userId,
        seen: undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  }
}
