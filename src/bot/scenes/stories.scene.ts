import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../bot.context';

export const STORIES_SCENE = 'STORIES_SCENE';

const ACTIONS = {
  Back: 'action:stories:back',
};

@Scene(STORIES_SCENE)
export class StoriesScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.ui('Stories', [Markup.callbackButton('Back', ACTIONS.Back)]);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
