import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from '../bot.context';

const ACTIONS = {
  Back: 'action:info:back',
};

export const ME_SCENE = 'ME_SCENE';

@Scene(ME_SCENE)
export class InfoScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const message = `Here, it's you 👾\n<code>${JSON.stringify(
      ctx.from,
      undefined,
      2,
    )}</code>`;

    const buttons = [
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ];

    await dialog.ui(message, buttons, { parse_mode: 'HTML' });
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
