import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Extra, Markup } from 'telegraf';
import { BotContext, SceneRouter } from '../bot.context';
import { ADMINISTRATION_SCENE } from './administration/administration.scene';
import { INFO_SCENE } from './info.scene';

export const START_SCENE = 'START_SCENE';

const ACTIONS = {
  Administration: 'action:start:administration',
  Info: 'action:start:info',
};

@Scene(START_SCENE)
export class StartScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<any> {
    const router = new SceneRouter(ctx);
    const message = `Hi, ${ctx.from.first_name} 👋`;
    const markup = Markup.inlineKeyboard([
      {
        callback_data: ACTIONS.Administration,
        text: 'Administration',
        hide: false,
      },
      {
        callback_data: ACTIONS.Info,
        text: 'Info',
        hide: false,
      },
    ]);

    await router.reply(message, Extra.markup(markup));
  }

  @Action(ACTIONS.Administration)
  async administration(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    await router.navigate(ADMINISTRATION_SCENE);
  }

  @Action(ACTIONS.Info)
  async info(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    await router.navigate(INFO_SCENE);
  }
}
