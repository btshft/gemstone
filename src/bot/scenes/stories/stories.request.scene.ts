import { UseGuards } from '@nestjs/common';
import { dropRight } from 'lodash';
import {
  Action,
  Ctx,
  Hears,
  Message,
  Scene,
  SceneEnter,
} from 'nestjs-telegraf';
import { immediate } from 'robot3';
import { BotContext } from 'src/bot/bot.context';
import { DialogRouter } from 'src/bot/dialog/dialog.router';
import { state$, transition$ } from 'src/bot/fsm/fsm.core';
import { State } from 'src/bot/fsm/fsm.metadata';
import { Role } from 'src/bot/security/bot.role.guard';
import { IgService } from 'src/ig/ig.service';
import { SagaService } from 'src/sagas/saga.service';
import { Markup } from 'telegraf';

export const STORIES_REQUEST_SCENE = 'STORIES_REQUEST_SCENE';

const RECENT_MAX_SIZE = 5;
const USERNAME_REGEXP = /^[a-zA-Z0-9._]{3,}$/i;
const ACTION_USERNAME_REGEXP = /^action:username:(?<username>[a-zA-Z0-9._]{3,})$/i;

type SceneContext = {
  igUserId?: number;
  igUsername: string;
  error?: string;
};

export type StoriesRequestState = {
  recent: { id: number; username: string }[];
  externalUsername?: string;
  returnScene?: string;
};

@Scene(STORIES_REQUEST_SCENE)
@UseGuards(Role('*'))
export class StoriesRequestScene {
  constructor(private ig: IgService, private sagaService: SagaService) {}

  @SceneEnter()
  async $init(@Ctx() ctx: BotContext): Promise<void> {
    const { fsm, router } = ctx;

    /* eslint-disable prettier/prettier */

    const activator = fsm.create<SceneContext>(STORIES_REQUEST_SCENE, {
      idle: state$(
        transition$('transition:start', 'start'),
        transition$('transition:validate', 'validate')
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
    const state = router.state<StoriesRequestState>();
    if (state.externalUsername) {
      await activator.send('transition:validate', {
        igUsername: state.externalUsername,
      });

      return;
    }

    await activator.send('transition:start');
  }

  @Hears(/^\/cancel$/i)
  async $cancel(@Ctx() ctx: BotContext): Promise<void> {
    const { fsm } = ctx;
    const activator = fsm.get(STORIES_REQUEST_SCENE);

    await activator.send('hears:cancel');
  }

  @Hears(USERNAME_REGEXP)
  // eslint-disable-next-line prettier/prettier
  async $username(@Ctx() ctx: BotContext, @Message('text') username: string): Promise<void> {
    const { fsm } = ctx;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    await activator.send('hears:username', {
      igUsername: username,
    });
  }

  @Action(ACTION_USERNAME_REGEXP)
  async $recent(@Ctx() ctx: BotContext): Promise<void> {
    const { fsm } = ctx;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    const username = ctx.callbackQuery.data.match(ACTION_USERNAME_REGEXP)
      ?.groups['username'];

    await ctx.answerCbQuery();
    await activator.send('hears:username', {
      igUsername: username,
    });
  }

  @State('start')
  async start(bot: BotContext): Promise<void> {
    const { ui, fsm, router } = bot;
    const activator = fsm.get(STORIES_REQUEST_SCENE);
    const state = router.state<StoriesRequestState>();

    if (state.recent && state.recent.length) {
      const buttons = state.recent.map((r) => {
        return Markup.callbackButton(
          `@${r.username}`,
          `action:username:${r.username}`,
        );
      });

      await ui.render(
        'Choose username from recent or enter a new one below or /cancel to return',
        Markup.inlineKeyboard(buttons, { columns: 1 }).resize(),
      );
    } else {
      await ui.render('Enter instagram username below or /cancel to return');
    }

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
      await activator.send('username:invalid', {
        error: 'Username was nor provided. It is probably a bug',
      });
      return;
    }

    const igUserId = await this.ig.userId(context.igUsername);
    if (!igUserId) {
      await activator.send('username:invalid', {
        error:
          'Could not find that user, check if provided username is correct 👀',
      });
      return;
    }

    const info = await this.ig.userInfo(igUserId);
    if (info && info.is_private) {
      await activator.send('username:invalid', {
        error: 'Could not load stories for that user, account is private 💩',
      });
      return;
    }

    const activityId = `stories:request:${bot.from.id}:${igUserId}`;
    const activityExists = await this.sagaService.activeExists(
      bot.app.user.id,
      activityId,
    );

    if (activityExists) {
      await activator.send('username:invalid', {
        error:
          "Could not load stories for that user, because I'm already working on his stories. Stay tuned ⚡️",
      });
      return;
    }

    await activator.send('username:valid', {
      igUserId: igUserId,
    });
  }

  @State('request')
  async request(bot: BotContext, ctx: SceneContext): Promise<void> {
    const { fsm } = bot;
    const activator = fsm.get<SceneContext>(STORIES_REQUEST_SCENE);

    await this.sagaService.create({
      metadata: {
        igUserId: ctx.igUserId,
        igUsername: ctx.igUsername,
        tgChatId: bot.chat.id,
        userId: bot.app.user.id,
      },
      state: 'ig:get-json',
      type: 'saga:stories:request',
      initiatorId: bot.app.user.id,
      activityId: `stories:request:${bot.from.id}:${ctx.igUserId}`,
    });

    await activator.send('request:complete');
  }

  @State('error')
  async error(bot: BotContext, ctx: SceneContext): Promise<void> {
    const { fsm } = bot;
    const activator = fsm.get(STORIES_REQUEST_SCENE);
    const error = ctx.error || 'Something went wrong.';

    await bot.reply(`${error}\nYou can retry or /cancel to exit`);

    await activator.send('transition:input');
  }

  @State('complete')
  async complete(bot: BotContext, ctx: SceneContext): Promise<void> {
    const { router, fsm } = bot;

    await bot.reply(
      `Got it! I'm off to get the @${ctx.igUsername} stories 👻\nI'll send them to you as soon as I download them.`,
    );

    this.updateRecent(router, ctx);

    const activator = fsm.get(STORIES_REQUEST_SCENE);
    await activator.send('transition:exit');
  }

  @State('exit')
  async exit(bot: BotContext): Promise<void> {
    const { router, ui } = bot;
    const state = router.state<StoriesRequestState>();

    await ui.delete();
    if (state.returnScene) {
      await router.navigate(state.returnScene);
    } else {
      await router.return();
    }
  }

  private updateRecent(router: DialogRouter, ctx: SceneContext): void {
    const current = router.state<StoriesRequestState>();
    if (!current.recent) current.recent = [];

    const update: StoriesRequestState = {
      recent: [
        {
          id: ctx.igUserId,
          username: ctx.igUsername,
        },
      ],
    };

    if (
      !current.recent.some((r) =>
        update.recent.map((s) => s.username).includes(r.username),
      )
    ) {
      const drop =
        current.recent.length >= RECENT_MAX_SIZE
          ? 1 + (current.recent.length - RECENT_MAX_SIZE)
          : 0;

      router.state<StoriesRequestState>({
        recent: [...update.recent, ...dropRight(current.recent, drop)],
      });
    }
  }
}
