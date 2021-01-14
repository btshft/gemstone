import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { StoriesQueue } from 'src/queue/stories/stories.queue';
import { Markup } from 'telegraf';

export const STORIES_PENDING_SCENE = 'STORIES_PENDING_SCENE';

const ACTIONS = {
  Back: 'action:stories:pending:back',
};

@Scene(STORIES_PENDING_SCENE)
export class StoriesPendingScene {
  constructor(private queue: StoriesQueue) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const tasks = this.queue.tasks(ctx.chat.id, ctx.from.id);
    if (!tasks || !tasks.length) {
      await dialog.ui('No pending tasks', [
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
      return;
    } else {
      const message = tasks.reduceRight((msg, task, idx) => {
        const row = `${idx + 1}. ${task.name}`;
        return msg ? `${msg}\n${row}` : row;
      }, '');

      await dialog.ui(message, [Markup.callbackButton('Back', ACTIONS.Back)]);
    }
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.return();
  }
}
