/* eslint-disable @typescript-eslint/ban-types */
import { SceneContext } from 'telegraf/typings/scenes';
import { CallbackQuery, Message } from 'telegraf/typings/telegram-types';
import { AppContext } from './app/app.context';
import { DialogRouter } from './dialog/dialog.router';
import { DialogUi } from './dialog/dialog.ui';
import { StateMachineAccessor } from './fsm/fsm.context';

export interface BotContext extends SceneContext {
  ui: DialogUi;
  router: DialogRouter;
  app: AppContext;
  fsm: StateMachineAccessor;
}

export function cbQuery(bot: BotContext): CallbackQuery.DataCallbackQuery {
  return <CallbackQuery.DataCallbackQuery>bot.callbackQuery;
}

export function message(bot: BotContext) {
  return <Message.TextMessage>bot.message;
}
