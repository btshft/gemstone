import { UseFilters } from '@nestjs/common';
import { Ctx, Start, Update } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { BotExceptionFilter } from './bot.exception.filter';
import { UserService } from 'src/user/user.service';
import { START_SCENE } from './scenes/start/start.scene';
import { Extra, Markup } from 'telegraf';

const START_REGEXP = /^\/start(?:[ =](?<token>[0-9a-fA-F]+))?$/i;

@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  constructor(private userService: UserService) {}

  @Start()
  async start(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    const { token } = ctx.update.message.text.match(START_REGEXP).groups;

    if (token) {
      const valid = await this.userService.validateRegistrationToken(token);
      if (!valid) {
        await ctx.reply('Invalid token');
        await this.userService.revokeRegistrationToken(token);
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

    if (ctx.app.user) {
      const buttons = [Markup.button('Favorites')];

      if (ctx.app.user.roles.some((r) => r.name === 'Administrator')) {
        buttons.push(Markup.button('Administration'));
      }

      await ctx.reply(
        `Hi, ${ctx.from.first_name} 👋\nGreat to see you!`,
        Extra.markup(Markup.keyboard(buttons, { columns: 2 }).resize()),
      );

      await router.navigate(START_SCENE);
    }
  }
}
