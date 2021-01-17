import {
  Action,
  Ctx,
  Hears,
  Message,
  Scene,
  SceneEnter,
} from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { IgService } from 'src/ig/ig.service';
import { Markup } from 'telegraf';

export const ADMINISTRATION_CHALLENGE_SCENE = 'ADMINISTRATION_CHALLENGE_SCENE';

const ACTIONS = {
  Start: 'action:administration:challenge:start',
  Retry: 'action:administration:challenge:retry',
  Back: 'action:administration:challenge:back',
};

type ChallengeState = {
  started: boolean;
};

@Scene(ADMINISTRATION_CHALLENGE_SCENE)
export class AdministrationChallengeScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;

    dialog.state<ChallengeState>({
      started: false,
    });

    await dialog.ui('Select start to begin challenge process', [
      Markup.callbackButton('Start', ACTIONS.Start),
      Markup.callbackButton('Back', ACTIONS.Back),
    ]);
  }

  @Action(ACTIONS.Start)
  async init(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const started = await this.ig.startChallenge();
    if (!started) {
      await dialog.ui('Unable to start challenge procedure', [
        Markup.callbackButton('Retry', ACTIONS.Retry),
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
    } else {
      dialog.state<ChallengeState>({
        started: started,
      });

      await dialog.ui('Enter code below', [
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
    }
  }

  @Hears(/^[a-zA-Z0-9._]+$/)
  async code(
    @Ctx() ctx: BotContext,
    @Message('text') message: string,
  ): Promise<void> {
    const { dialog } = ctx;
    const { started } = dialog.state<ChallengeState>();
    if (started) {
      const result = await this.ig.completeChallenge(message);
      if (result) {
        ctx.reply('Challenge succeed!');
        await dialog.return();
      } else {
        await dialog.ui('Unable to complete challenge procedure', [
          Markup.callbackButton('Retry', ACTIONS.Retry),
          Markup.callbackButton('Back', ACTIONS.Back),
        ]);
      }
    }
  }

  @Action(ACTIONS.Retry)
  async retry(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(ADMINISTRATION_CHALLENGE_SCENE);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
