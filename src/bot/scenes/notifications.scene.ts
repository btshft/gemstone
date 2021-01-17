import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { UserNotification } from 'src/notifications/notifications.types';
import { Extra, Markup } from 'telegraf';
import { BotContext } from '../bot.context';

export const NOTIFICATIONS_SCENE = 'NOTIFICATIONS_SCENE';

const ACTIONS = {
  Back: 'action:notifications:back',
};

export type NotificationsSceneState = {
  notifications: UserNotification;
};

@Scene(NOTIFICATIONS_SCENE)
export class NotificationsScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const { notifications } = dialog.state<NotificationsSceneState>();
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
