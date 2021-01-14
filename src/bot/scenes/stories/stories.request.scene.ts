import {
  Action,
  Ctx,
  Hears,
  Message,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { IgService } from 'src/ig/ig.service';
import { StoriesQueue } from 'src/queue/stories/stories.queue';
import { Markup } from 'telegraf';
import { StoriesSceneState } from './stories.scene';

export const STORIES_REQUEST_SCENE = 'STORIES_REQUEST_SCENE';

const ACTIONS = {
  Back: 'action:stories:request:back',
  Submit: 'action:stories:request:submit',
  Reenter: 'action:stories:request:reeenter',
};

type SceneState = {
  username: string;
  userId: number;
};

@Scene(STORIES_REQUEST_SCENE)
export class StoriesRequestScene {
  constructor(private ig: IgService, private queue: StoriesQueue) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;

    dialog.state({});
    await dialog.ui('Provide username', [
      Markup.callbackButton('Back', ACTIONS.Back),
    ]);
  }

  @Hears(/^[a-zA-Z0-9._]+$/)
  async username(
    @Ctx() ctx: BotContext,
    @Message('text') message: string,
  ): Promise<void> {
    const { dialog } = ctx;
    const userId = await this.ig.userId(message);
    if (!userId) {
      await ctx.reply(
        "Sorry but I can't find that user, check username is correct",
      );
      return;
    }

    dialog.state<SceneState>({
      userId: userId,
      username: message,
    });

    await dialog.ui(
      `Aha, I've found that one! Load ${message} stories?`,
      [
        Markup.callbackButton('No', ACTIONS.Reenter),
        Markup.callbackButton('Yes', ACTIONS.Submit),
      ],
      { recreate: true },
    );
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }

  @Action(ACTIONS.Submit)
  async submit(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const { userId, username } = dialog.state();

    if (userId) {
      await this.queue.request({
        ig: {
          userId: userId,
          username: username,
        },
        tg: {
          chatId: ctx.chat.id,
          userId: ctx.from.id,
        },
      });
    }

    await dialog.return<StoriesSceneState>({
      message:
        'Request submited, you can check it from the Pending requests tab.',
    });
  }

  @Action(ACTIONS.Reenter)
  async reenter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(STORIES_REQUEST_SCENE);
  }

  @SceneLeave()
  async leave(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    dialog.state({});
  }
}
