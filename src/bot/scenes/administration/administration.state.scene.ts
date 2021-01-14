import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { IgService } from 'src/ig/ig.service';
import { Markup } from 'telegraf';

export const ADMINISTRATION_STATE_SCENE = 'ADMINISTRATION_STATE_SCENE';

const ACTIONS = {
  Back: 'action:administration:state:back',
};

@Scene(ADMINISTRATION_STATE_SCENE)
export class AdministrationStateScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const state = await this.ig.state();
    const message = `IG state 👾\n<code>${JSON.stringify(
      state,
      undefined,
      2,
    )}</code>`;

    const buttons = [Markup.callbackButton('Back', ACTIONS.Back)];
    await dialog.ui(message, buttons, { parse_mode: 'HTML' });
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
