import { UseFilters, UseGuards } from '@nestjs/common';
import { Action, Ctx, Hears, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../bot.context';
import { BotExceptionFilter } from '../bot.exception.filter';
import { KeyboardBuilder } from '../dialog/keyboard.builder';
import { Role } from '../security/bot.role.guard';
import { ADMINISTRATION_SCENE } from './administration/administration.scene';
import {
  ResolveProfileSceneState,
  RESOLVE_PROFILE_SCENE,
} from './resolve-profile.scene';
import { STORIES_SCENE } from './stories/stories.scene';

export const START_SCENE = 'START_SCENE';

const PROFILE_REGEXP = /^http(s)?:\/\/instagram\.com\/(?<username>[a-zA-Z0-9._]{3,})(\/)?$/i;

const ACTIONS = {
  Administration: 'action:start:administration',
  Me: 'action:start:info',
  Stories: 'action:start:stories',
  Notifications: 'action:start:notifications',
};

@Scene(START_SCENE)
@UseFilters(BotExceptionFilter)
@UseGuards(Role('*'))
export class StartScene {
  constructor(private markupBuilder: KeyboardBuilder) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<any> {
    const { ui } = ctx;
    const message = `Hi, ${ctx.from.first_name} 👋\nGreat to see you!`;

    const markup = await this.markupBuilder
      .forRoles('Administrator')
      .use([Markup.callbackButton('⚙️ Administration', ACTIONS.Administration)])
      .forRoles('Administrator', 'User')
      .use([Markup.callbackButton('🔮 Stories', ACTIONS.Stories)])
      .build(ctx);

    await ui.delete();
    await ui.render(message, markup);
  }

  @Action(ACTIONS.Administration)
  async administration(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(ADMINISTRATION_SCENE);
  }

  @Action(ACTIONS.Stories)
  async stories(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(STORIES_SCENE);
  }

  @Hears(PROFILE_REGEXP)
  async test(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    const username = ctx.message.text.match(PROFILE_REGEXP).groups['username'];

    await router.navigate(RESOLVE_PROFILE_SCENE, <ResolveProfileSceneState>{
      igUsername: username,
    });
  }
}
