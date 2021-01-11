import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Extra, Markup } from 'telegraf';
import { BotContext, SceneRouter } from '../bot.context';
import { START_SCENE } from './start.scene';

export const ERROR_SCENE = 'ERROR_SCENE';

const ACTIONS = {
  Back: 'action:error:back',
};

export type ErrorSceneState = {
  message: string;
};

@Scene(ERROR_SCENE)
export class ErrorScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<any> {
    const router = new SceneRouter(ctx);
    const state = router.state<ErrorSceneState>();
    const markup = Markup.inlineKeyboard([
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ]);

    await router.reply(state.message, Extra.markup(markup));
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);

    await ctx.deleteMessage();
    await router.navigate(START_SCENE, { dropHistory: true });
  }
}
