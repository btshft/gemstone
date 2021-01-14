import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { IgService } from 'src/ig/ig.service';
import { Markup } from 'telegraf';
import { START_SCENE } from '../start.scene';
import { ADMINISTRATION_STATE_SCENE } from './administration.state.scene';

export const ADMINISTRATION_SCENE = 'ADMINISTRATION_SCENE';

const ACTIONS = {
  Login: 'action:administration:login',
  Challenge: 'action:administration:challenge',
  State: 'action:administration:state',
  Back: 'action:administration:back',
};

@Scene(ADMINISTRATION_SCENE)
export class AdministrationScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const message = `Select option`;
    const buttons = [
      Markup.callbackButton('Login', ACTIONS.Login),
      Markup.callbackButton('Challenge', ACTIONS.Challenge),
      Markup.callbackButton('State', ACTIONS.State),
      Markup.callbackButton('Back', ACTIONS.Back),
    ];

    await dialog.ui(message, Markup.inlineKeyboard(buttons, { columns: 2 }));
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }

  @Action(ACTIONS.Login)
  async login(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const status = await this.ig.authenticate();
    await dialog.answer(`login: ${status}`);
  }

  @Action(ACTIONS.State)
  async state(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(ADMINISTRATION_STATE_SCENE);
  }
}
