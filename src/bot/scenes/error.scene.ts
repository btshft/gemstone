import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from '../bot.context';
import { START_SCENE } from './start/start.scene';

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
    const { ui, router } = ctx;
    const state = router.state<ErrorSceneState>();
    const buttons = [
      {
        callback_data: ACTIONS.Back,
        text: 'Back',
        hide: false,
      },
    ];

    await ui.render(state.message, buttons);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(START_SCENE);
  }
}
