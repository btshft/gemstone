import { CanActivate, ExecutionContext } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Observable } from 'rxjs';
import { BotContext } from '../bot.context';
import { BotException } from '../bot.exception';

export function Role(role: RoleName | '*'): CanActivate {
  return {
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const tgCtx = TelegrafExecutionContext.create(context);
      const { app, from } = tgCtx.getContext<BotContext>();
      const createException = () => {
        return BotException.unauthorized({
          from: from,
          reply: {
            message: "You're not authorized to access, sorry 🤷‍♂️",
            scene: false,
          },
        });
      };

      if (!app.user) {
        throw createException();
      }

      const { roles } = app.user;
      if (!roles || !roles.length) {
        throw createException();
      }

      if (role != '*') {
        const includes = roles.map((r) => r.name).includes(role);
        if (!includes) throw createException();
      }

      return true;
    },
  };
}
