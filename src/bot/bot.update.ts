import { UseFilters, UseGuards } from '@nestjs/common';
import { Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { BotContext, SceneRouter } from './bot.context';
import { BotExceptionFilter } from './bot-exception.filter';
import { START_SCENE } from './scenes/start.scene';
import { BotAuthGuard } from './bot-auth.guard';

@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  @Start()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const router = new SceneRouter(ctx);
    await router.navigate(START_SCENE, { complete: false, dropHistory: true });
  }

  @Command('me')
  @UseGuards(BotAuthGuard)
  async me(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.replyWithHTML(`<code>${JSON.stringify(ctx.me)}</code>`);
  }
}
