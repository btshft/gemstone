import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { BotException, BotFailure, Unauthorized } from './bot.exception';
import { ErrorSceneState, ERROR_SCENE } from './scenes/error.scene';

function isUnauthorized(failure: BotFailure): failure is Unauthorized {
  return failure.type === 'unauthorized';
}

@Catch()
export class BotExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger('bot.exceptions');

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    if (exception instanceof BotException) {
      const { message, failure } = <BotException>exception;
      if (isUnauthorized(failure)) {
        this.logger.error(`[Unauthorized]: ${message}`);
      }

      if (failure.reply) {
        const { message, scene: navigation } = failure.reply;
        const context = TelegrafArgumentsHost.create(
          host,
        ).getContext<BotContext>();

        if (navigation) {
          await this.navigateToError(context, message);
        } else {
          await context.reply(message);
        }
      } else {
        this.logger.error(`${exception.name}: ${exception.message}`);
      }
    }
  }

  private async navigateToError(
    context: BotContext,
    message: string,
  ): Promise<void> {
    const { dialog } = context;

    await dialog.navigate<ErrorSceneState>(ERROR_SCENE, {
      state: {
        message: message,
      },
    });
  }
}
