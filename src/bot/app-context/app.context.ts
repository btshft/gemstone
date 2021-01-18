import { RoleName, User } from '@prisma/client';
import { th } from 'date-fns/locale';
import { Prisma } from 'src/database/services/prisma';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { BotContext } from '../bot.context';

type UserType = User & {
  roles: {
    name: RoleName;
  }[];
};

export interface AppContext {
  user: UserType;
  refresh(): Promise<void>;
}

class _AppContext implements AppContext {
  constructor(private prisma: Prisma, private context: BotContext) {}

  public user: UserType;

  public async refresh(): Promise<void> {
    this.user = await this.prisma.user.findUnique({
      where: {
        telegramUserId: String(this.context.from.id),
      },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });
  }
}

export function appContext(prisma: Prisma): MiddlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.app) {
      ctx.app = new _AppContext(prisma, ctx);
      await ctx.app.refresh();
    }
    return await next();
  };
}
