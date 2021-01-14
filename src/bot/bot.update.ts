import { UseFilters, UseGuards } from '@nestjs/common';
import { Ctx, Start, Update } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { START_SCENE } from './scenes/start.scene';
import { BotAuthGuard } from './bot.auth.guard';
import { BotExceptionFilter } from './bot.exception.filter';

@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  @Start()
  @UseGuards(BotAuthGuard)
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    await dialog.navigate(START_SCENE, {
      fromDialog: false,
    });
  }
}
