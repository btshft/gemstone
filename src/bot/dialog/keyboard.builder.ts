import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { isArray } from 'lodash';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import { BotContext } from '../bot.context';

type _BuilderStage = (
  bot: BotContext,
) => InlineKeyboardButton[] | Promise<InlineKeyboardButton[]>;

type _UseMarkup = InlineKeyboardButton | InlineKeyboardButton[];

class _ForRole {
  constructor(
    private readonly builder: KeyboardBuilder,
    private readonly roles: RoleName[],
  ) {}

  public use(markup: _UseMarkup): KeyboardBuilder {
    return this.builder.stage((ctx) => {
      const { user } = ctx.app;
      const userRoles = user.roles.map((r) => r.name);

      if (userRoles.some((ur) => this.roles.includes(ur))) {
        return this.resolve(markup);
      }

      return Promise.resolve([]);
    });
  }

  private resolve(markup: _UseMarkup): InlineKeyboardButton[] {
    return isArray(markup) ? markup : [markup];
  }
}

@Injectable()
export class KeyboardBuilder {
  private stages: _BuilderStage[] = [];

  stage(fn: _BuilderStage): KeyboardBuilder {
    this.stages = [...this.stages, fn];
    return this;
  }

  forRoles(...roles: RoleName[]): _ForRole {
    return new _ForRole(this, roles);
  }

  async build(bot: BotContext): Promise<InlineKeyboardButton[]> {
    let result: InlineKeyboardButton[] = [];

    for (const fn of this.stages) {
      const update = await fn(bot);
      result = [...result, ...update];
    }

    this.stages = [];
    return result;
  }
}
