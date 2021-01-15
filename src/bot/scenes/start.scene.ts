import { UseFilters } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../bot.context';
import { BotExceptionFilter } from '../bot.exception.filter';
import { ADMINISTRATION_SCENE } from './administration/administration.scene';
import { ME_SCENE } from './me.scene';
import { STORIES_SCENE } from './stories/stories.scene';

export const START_SCENE = 'START_SCENE';

const ACTIONS = {
  Administration: 'action:start:administration',
  Me: 'action:start:info',
  Stories: 'action:start:stories',
};

@Scene(START_SCENE)
@UseFilters(BotExceptionFilter)
export class StartScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<any> {
    const { dialog } = ctx;
    const message = `Hi, ${ctx.from.first_name} 👋`;
    const buttons = [
      Markup.callbackButton('Administration', ACTIONS.Administration),
      Markup.callbackButton('Stories', ACTIONS.Stories),
      Markup.callbackButton('Me', ACTIONS.Me),
    ];

    await dialog.ui(message, buttons);
  }

  @Action(ACTIONS.Administration)
  async administration(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(ADMINISTRATION_SCENE);
  }

  @Action(ACTIONS.Me)
  async info(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(ME_SCENE);
  }

  @Action(ACTIONS.Stories)
  async stories(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(STORIES_SCENE);
  }
}
