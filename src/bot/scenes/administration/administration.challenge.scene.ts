import { UseGuards } from '@nestjs/common';
import {
  Action,
  Ctx,
  Hears,
  Message,
  Scene,
  SceneEnter,
} from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { Role } from 'src/bot/security/bot.role.guard';
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
@UseGuards(Role('Administrator'))
export class AdministrationChallengeScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const { router, ui } = ctx;

    router.state<ChallengeState>({
      started: false,
    });

    await ui.render('Select start to begin challenge process', [
      Markup.callbackButton('Start', ACTIONS.Start),
      Markup.callbackButton('Back', ACTIONS.Back),
    ]);
  }

  @Action(ACTIONS.Start)
  async init(@Ctx() ctx: BotContext): Promise<void> {
    const { router, ui } = ctx;
    const started = await this.ig.startChallenge();
    if (!started) {
      await ui.render('Unable to start challenge procedure', [
        Markup.callbackButton('Retry', ACTIONS.Retry),
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
    } else {
      router.state<ChallengeState>({
        started: started,
      });

      await ui.render('Enter code below', [
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
    }
  }

  @Hears(/^[a-zA-Z0-9._]+$/)
  async code(
    @Ctx() ctx: BotContext,
    @Message('text') message: string,
  ): Promise<void> {
    const { router, ui } = ctx;
    const { started } = router.state<ChallengeState>();
    if (started) {
      const result = await this.ig.completeChallenge(message);
      if (result) {
        ctx.reply('Challenge succeed!');
        await router.return();
      } else {
        await ui.render('Unable to complete challenge procedure', [
          Markup.callbackButton('Retry', ACTIONS.Retry),
          Markup.callbackButton('Back', ACTIONS.Back),
        ]);
      }
    }
  }

  @Action(ACTIONS.Retry)
  async retry(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(ADMINISTRATION_CHALLENGE_SCENE);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.return();
  }
}
