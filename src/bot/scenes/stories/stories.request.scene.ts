import { Ctx, Hears, Message, Scene, SceneEnter } from 'nestjs-telegraf';
import { immediate } from 'robot3';
import { BotContext } from 'src/bot/bot.context';
import { state$, transition$ } from 'src/bot/fsm/fsm.core';
import { State } from 'src/bot/fsm/fsm.metadata';
import { IgService } from 'src/ig/ig.service';
import { SagaClient } from 'src/sagas/api/sagas.api.client';
import { StoriesSagaGetJson } from 'src/sagas/saga.types';

export const STORIES_REQUEST_SCENE = 'STORIES_REQUEST_SCENE';

type SceneContext = {
  igUserId?: number;
  igUsername: string;
};

@Scene(STORIES_REQUEST_SCENE)
export class StoriesRequestScene {
  constructor(private ig: IgService, private sagaClient: SagaClient) {}

  @SceneEnter()
  async $init(@Ctx() ctx: BotContext): Promise<void> {
    const { fsm } = ctx;

    /* eslint-disable prettier/prettier */

    const activator = fsm.create(STORIES_REQUEST_SCENE, {
      idle: state$(
        transition$('transition:start', 'start')
      ),
      start: state$(
        transition$('transition:input', 'input')
      ),
      input: state$(
        transition$('hears:username', 'validate'),
        transition$('hears:cancel', 'exit')
      ),
      validate: state$(
        transition$('username:valid', 'request'),
        transition$('username:invalid', 'error'),
      ),
      request: state$(
        transition$('request:complete', 'complete')
      ),
      error: state$(
        transition$('transition:input', 'input'),
      ),
      complete: state$(
        transition$('transition:exit', 'exit'),
      ),
      $exception: state$(
        immediate('exit')
      ),
      exit: state$(),
    }, this);

    /* eslint-enable prettier/prettier */

    await activator.send('transition:start');
  }

  @Hears(/^\/cancel$/i)
  async $cancel(@Ctx() ctx: BotContext): Promise<void> {
    const { fsm } = ctx;
    const activator = fsm.get(STORIES_REQUEST_SCENE);

    await activator.send('hears:cancel');
  }

  @Hears(/^[a-zA-Z0-9._]+$/)
  // eslint-disable-next-line prettier/prettier
  async $username(@Ctx() ctx: BotContext, @Message('text') username: string): Promise<void> {
    const { fsm } = ctx;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    await activator.send('hears:username', {
      igUsername: username,
    });
  }

  @State('start')
  async start(bot: BotContext): Promise<void> {
    const { ui, fsm } = bot;
    const activator = fsm.get(STORIES_REQUEST_SCENE);

    await ui.visible(false);
    await bot.reply('Enter username below or /cancel to escape');
    await activator.send('transition:input');
  }

  @State('return')
  async cancel(bot: BotContext): Promise<void> {
    const { router } = bot;
    await router.return();
  }

  @State('validate')
  async validate(bot: BotContext, context: SceneContext): Promise<void> {
    const { fsm } = bot;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    if (!context.igUsername) {
      await activator.send('username:invalid');
      return;
    }

    const userId = await this.ig.userId(context.igUsername);
    if (!userId) {
      await activator.send('username:invalid');
      return;
    }

    await activator.send('username:valid', {
      igUserId: userId,
    });
  }

  @State('request')
  async request(bot: BotContext, ctx: SceneContext): Promise<void> {
    const { fsm } = bot;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    await this.sagaClient.create<StoriesSagaGetJson>({
      metadata: {
        igUserId: ctx.igUserId,
        igUsername: ctx.igUsername,
        tgChatId: bot.chat.id,
        userId: bot.app.user.id,
      },
      state: 'ig:get-json',
      type: 'saga:stories:request',
    });

    await activator.send('request:complete');
  }

  @State('error')
  async error(bot: BotContext): Promise<void> {
    const { fsm } = bot;
    const activator = fsm.get(STORIES_REQUEST_SCENE);

    await bot.reply(
      "Sorry but I can't find that user on instagram, check username is correct and try again or /cancel to escape",
    );

    await activator.send('transition:input');
  }

  @State('complete')
  async complete(bot: BotContext): Promise<void> {
    await bot.tg.sendMessage(
      bot.chat.id,
      "Request submitted. I'll send them once they'll be ready.",
      {
        reply_to_message_id: bot.message.message_id,
      },
    );

    await bot.ui.visible(true);
    await bot.router.return();
  }

  @State('exit')
  async exit(bot: BotContext): Promise<void> {
    await bot.ui.visible(true);
    await bot.router.return();
  }
}
