import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../../bot.context';
import { STORIES_REQUEST_SCENE } from './stories.request.scene';

export const STORIES_SCENE = 'STORIES_SCENE';

const ACTIONS = {
  Back: 'action:stories:back',
  Request: 'action:stories:request',
};

export type StoriesSceneState = {
  message: string;
};

@Scene(STORIES_SCENE)
export class StoriesScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const { message } = dialog.state();
    const text = message ? `Stories\n${message}` : 'Stories';

    await dialog.ui(
      text,
      Markup.inlineKeyboard(
        [
          Markup.callbackButton('Request', ACTIONS.Request),
          Markup.callbackButton('Back', ACTIONS.Back),
        ],
        { columns: 2 },
      ),
    );
  }

  @Action(ACTIONS.Request)
  async request(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(STORIES_REQUEST_SCENE);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
