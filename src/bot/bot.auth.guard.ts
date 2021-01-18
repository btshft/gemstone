import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Observable } from 'rxjs';
import botConfiguration from './bot.configuration';
import { BotContext } from './bot.context';
import { BotException } from './bot.exception';

@Injectable()
export class BotAuthGuard implements CanActivate {
  constructor(
    @Inject(botConfiguration.KEY)
    private config: ConfigType<typeof botConfiguration>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const tgCtx = TelegrafExecutionContext.create(context);
    const { app, from } = tgCtx.getContext<BotContext>();

    if (!app.user) {
      throw BotException.unauthorized({
        from: from,
        reply: {
          message: "You're not authorized to access, sorry 👻",
          scene: false,
        },
      });
    }

    return true;
  }
}
