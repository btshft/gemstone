import { UseGuards } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { Role } from 'src/bot/security/bot.role.guard';
import { IgService } from 'src/ig/ig.service';
import { Markup } from 'telegraf';

export const ADMINISTRATION_STATE_SCENE = 'ADMINISTRATION_STATE_SCENE';

const ACTIONS = {
  Back: 'action:administration:state:back',
};

@Scene(ADMINISTRATION_STATE_SCENE)
@UseGuards(Role('Administrator'))
export class AdministrationStateScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { ui } = ctx;
    const state = await this.ig.state();
    const message = `IG state 👾\n<code>${JSON.stringify(
      state,
      undefined,
      2,
    )}</code>`;

    const buttons = [Markup.button.callback('Back', ACTIONS.Back)];
    await ui.render(message, buttons, { parse_mode: 'HTML' });
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.return();
  }
}
