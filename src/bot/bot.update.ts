import { UseFilters } from '@nestjs/common';
import { Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { START_SCENE } from './scenes/start.scene';
import { BotExceptionFilter } from './bot.exception.filter';
import { UserService } from 'src/user/user.service';

const START_REGEXP = /^\/start(?:[ =](?<token>[0-9a-fA-F]+))?$/i;
@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  constructor(private userService: UserService) {}

  @Start()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const { dialog } = ctx;
    const { token } = ctx.update.message.text.match(START_REGEXP).groups;

    if (token) {
      const valid = await this.userService.validateRegistrationToken(token);
      if (!valid) {
        await ctx.reply('Invalid token');
        return;
      }

      const userExists = await this.userService.userExists(ctx.from.id);
      if (!userExists) {
        await this.userService.createUser(
          token,
          ctx.from.username,
          ctx.from.id,
        );
        await ctx.app.refresh();
      }

      await this.userService.revokeRegistrationToken(token);
    }

    await dialog.navigate(START_SCENE, {
      fromDialog: false,
    });
  }
}
