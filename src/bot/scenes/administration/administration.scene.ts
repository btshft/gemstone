import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext, SceneRouter } from 'src/bot/bot.context';
import { Extra, Markup } from 'telegraf';

export const ADMINISTRATION_SCENE = 'ADMINISTRATION_SCENE';

const ACTIONS = {
  Login: 'action:administration:login',
  Challenge: 'action:administration:challenge',
  Back: 'action:administration:back',
};

@Scene(ADMINISTRATION_SCENE)
export class AdministrationScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    const message = `Select option`;
    const markup = Markup.inlineKeyboard([
      {
        callback_data: ACTIONS.Login,
        text: 'Login',
        hide: false,
      },
      {
        callback_data: ACTIONS.Challenge,
        text: 'Challenge',
        hide: false,
      },
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ]);

    await router.reply(message, Extra.markup(markup));
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    await router.return();
  }
}
