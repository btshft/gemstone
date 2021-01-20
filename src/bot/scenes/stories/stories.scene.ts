import { UseGuards } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Role } from 'src/bot/security/bot.role.guard';
import { Markup } from 'telegraf';
import { BotContext } from '../../bot.context';
import { STORIES_REQUEST_SCENE } from './stories.request.scene';

export const STORIES_SCENE = 'STORIES_SCENE';

const ACTIONS = {
  Back: 'action:stories:back',
  Request: 'action:stories:request',
};

@Scene(STORIES_SCENE)
@UseGuards(Role('User'))
export class StoriesScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { ui } = ctx;
    const text =
      "🔮 Stories\nHere you can request someone's stories or subscribe to them.";

    await ui.render(
      text,
      Markup.inlineKeyboard(
        [
          Markup.callbackButton('Request', ACTIONS.Request),
          Markup.callbackButton('Back', ACTIONS.Back),
        ],
        { columns: 2 },
      ),
    );
  }

  @Action(ACTIONS.Request)
  async request(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(STORIES_REQUEST_SCENE);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.return();
  }
}
