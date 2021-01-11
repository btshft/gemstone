import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Extra, Markup } from 'telegraf';
import { BotContext, SceneRouter } from '../bot.context';

const ACTIONS = {
  Back: 'action:info:back',
};

export const INFO_SCENE = 'INFO_SCENE';

@Scene(INFO_SCENE)
export class InfoScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    const message = `Use it wisely 👾\n<code>${JSON.stringify(
      ctx.from,
      undefined,
      2,
    )}</code>`;
    const markup = Markup.inlineKeyboard([
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ]);

    await router.reply(message, Extra.HTML().markup(markup));
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    await router.return();
  }
}
