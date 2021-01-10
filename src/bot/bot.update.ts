import { UseFilters, UseGuards } from '@nestjs/common';
import { Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { BotExceptionFilter } from './filters/bot-exception.filter';
import { BotAuthGuard } from './guards/bot-auth.guard';

@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  @Start()
  @UseGuards(BotAuthGuard)
  async start(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.replyWithMarkdown('👋');
  }

  @Command('me')
  async me(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.replyWithHTML(`<code>${JSON.stringify(ctx.from)}</code>`);
  }
}
