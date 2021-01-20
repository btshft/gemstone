import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { BotException } from './bot.exception';
import { ErrorSceneState, ERROR_SCENE } from './scenes/error.scene';

@Catch()
export class BotExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger('Bot');

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    this.logger.error(`${exception.name}: ${exception.message}`);

    if (exception instanceof BotException) {
      const { failure } = <BotException>exception;
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
      }
    }
  }

  private async navigateToError(
    context: BotContext,
    message: string,
  ): Promise<void> {
    const { router } = context;

    await router.navigate<ErrorSceneState>(ERROR_SCENE, { message: message });
  }
}
