import { Ctx, Start, Update } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { START_SCENE } from './scenes/start.scene';

@Update()
export class BotUpdate {
  @Start()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    await ctx.scene.enter(START_SCENE);
  }
}
