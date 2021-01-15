import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { TaskStore } from 'src/tasks/task.store';
import { Markup } from 'telegraf';

export const STORIES_PENDING_SCENE = 'STORIES_PENDING_SCENE';

const ACTIONS = {
  Back: 'action:stories:pending:back',
};

@Scene(STORIES_PENDING_SCENE)
export class StoriesPendingScene {
  constructor(private tasks: TaskStore) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const region = `${ctx.chat.id}:${ctx.from.id}`;
    const tasks = this.tasks.many(region);

    if (!tasks || !tasks.length) {
      await dialog.ui('No pending tasks', [
        Markup.callbackButton('Back', ACTIONS.Back),
      ]);
      return;
    } else {
      const message = tasks.reduceRight((msg, task, idx) => {
        const row = `${idx + 1}. ${task.text} (status: ${task.status})`;
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
