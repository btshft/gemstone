import { UseGuards } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { IgService } from 'src/ig/ig.service';
import { Markup } from 'telegraf';
import { BotContext } from '../bot.context';
import { Role } from '../security/bot.role.guard';
import { START_SCENE } from './start.scene';
import {
  StoriesRequestState,
  STORIES_REQUEST_SCENE,
} from './stories/stories.request.scene';

export const RESOLVE_PROFILE_SCENE = 'RESOLVE_PROFILE_SCENE';

export type ResolveProfileSceneState = {
  igUsername: string;
  igUserId?: string;
};

const ACTIONS = {
  Close: 'action:resolve-profile:close',
  Stories: 'action:resolve-profile:request',
};

@Scene(RESOLVE_PROFILE_SCENE)
@UseGuards(Role('*'))
export class ResolveProfileScene {
  constructor(private ig: IgService) {}

  @SceneEnter()
  async enter(@Ctx() bot: BotContext): Promise<void> {
    const { router, ui } = bot;
    const state = router.state<ResolveProfileSceneState>();

    if (!state.igUsername) {
      await router.return();
    }

    const userId = await this.ig.userId(state.igUsername);
    if (userId) {
      const userInfo = await this.ig.userInfo(userId);
      if (userInfo && userInfo.is_private) {
        await bot.reply('This account is private, can,t help');
        await ui.delete();
        await router.return();
      }
    }

    await ui.delete();
    await ui.render(`What you want to do with @${state.igUsername} ?`, [
      Markup.callbackButton('Get stories', ACTIONS.Stories),
      Markup.callbackButton('Close', ACTIONS.Close),
    ]);
  }

  @Action(ACTIONS.Close)
  async $close(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;

    await bot.answerCbQuery();
    await router.return();
  }

  @Action(ACTIONS.Stories)
  async $stories(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const state = router.state<ResolveProfileSceneState>();

    await router.navigate<StoriesRequestState>(STORIES_REQUEST_SCENE, {
      externalUsername: state.igUsername,
      returnScene: START_SCENE,
      recent: [],
    });
  }
}
