import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../bot.context';

export const START_SCENE = 'START_SCENE';

@Scene(START_SCENE)
export class StartScene {
  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.reply('Hi!', {
      reply_markup: Markup.inlineKeyboard([
        { text: 'Ok', callback_data: 'ok', hide: false },
      ]),
    });
  }

  @Action('ok')
  async replyOk(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.answerCbQuery('answer');
  }
}
