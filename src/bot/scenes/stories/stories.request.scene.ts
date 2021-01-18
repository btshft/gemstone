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
import { SagaClient } from 'src/sagas/api/sagas.api.client';
import { StoriesSagaGetJson } from 'src/sagas/saga.types';
import { Markup } from 'telegraf';
import { START_SCENE } from '../start.scene';

export const STORIES_REQUEST_SCENE = 'STORIES_REQUEST_SCENE';

const ACTIONS = {
  Back: 'action:stories:request:back',
  Reenter: 'action:stories:request:reeenter',
};

type RequestStories = {
  userId: string;
  tg: {
    from: number | string;
    chat: number | string;
  };
  ig: {
    usename: string;
    id: string | number;
  };
};

@Scene(STORIES_REQUEST_SCENE)
export class StoriesRequestScene {
  constructor(private ig: IgService, private sagaClient: SagaClient) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;

    dialog.state({});
    await dialog.ui('Enter username below', [
      Markup.callbackButton('Back', ACTIONS.Back),
    ]);
  }

  @Hears(/^[a-zA-Z0-9._]+$/)
  async username(
    @Ctx() ctx: BotContext,
    @Message('text') username: string,
  ): Promise<void> {
    const { dialog } = ctx;
    const userId = await this.ig.userId(username);
    if (!userId) {
      await ctx.reply(
        "Sorry but I can't find that user, check username is correct",
      );

      await dialog.ui();
      return;
    }

    await this.requestStories({
      userId: ctx.app.user.id,
      ig: {
        id: userId,
        usename: username,
      },
      tg: {
        chat: ctx.chat.id,
        from: ctx.from.id,
      },
    });

    await ctx.reply("Request submitted. I'll send them once they'll be ready.");
    await dialog.ui();
    await dialog.navigate(START_SCENE);
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
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

  async requestStories(request: RequestStories): Promise<void> {
    await this.sagaClient.create<StoriesSagaGetJson>({
      metadata: {
        igUserId: request.ig.id,
        tgChatId: request.tg.chat,
        igUsername: request.ig.usename,
        userId: request.userId,
      },
      state: 'ig:get-json',
      type: 'saga:stories:request',
    });
  }
}
