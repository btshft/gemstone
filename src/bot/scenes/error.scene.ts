import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from '../bot.context';
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
    const { dialog } = ctx;
    const state = dialog.state<ErrorSceneState>();
    const buttons = [
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ];

    await dialog.ui(state.message, buttons);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return({ fallback: START_SCENE });
  }
}
