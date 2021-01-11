import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { BotContext, SceneRouter } from './bot.context';
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
        await this.navigateToError(failure.reply.message, host);
      }
    } else {
      this.logger.error(`${exception.name}: ${exception.message}`);
    }
  }

  private async navigateToError(
    text: string,
    host: ArgumentsHost,
  ): Promise<void> {
    const tgHost = TelegrafArgumentsHost.create(host);
    const tgCtx = tgHost.getContext<BotContext>();
    const router = new SceneRouter(tgCtx);

    await router.navigate<ErrorSceneState>(ERROR_SCENE, {
      dropHistory: true,
      state: {
        message: text,
      },
    });
  }
}
