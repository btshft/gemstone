import { Logger } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { IgService } from 'src/ig/ig.service';
import { START_SCENE } from '../start.scene';

export const ADMINISTRATION_SCENE = 'ADMINISTRATION_SCENE';

const ACTIONS = {
  Login: 'action:administration:login',
  Challenge: 'action:administration:challenge',
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
    ];

    await dialog.ui(message, buttons);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(START_SCENE);
  }

  @Action(ACTIONS.Login)
  async login(@Ctx() ctx: BotContext): Promise<void> {
    try {
      await this.ig.authenticate();
    } catch (err) {
      new Logger(AdministrationScene.name).error({ error: err });
    }
    await ctx.reply('Ok');
  }
}
