import { Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { SagaService } from 'src/sagas/saga.service';
import { SagaHandler } from 'src/sagas/saga.types';
import { Telegraf } from 'telegraf';
import { TtSagaTgSend } from '../saga.tt';

export class TtTgSendHandler implements SagaHandler<TtSagaTgSend> {
  private readonly logger = new Logger(TtTgSendHandler.name);

  constructor(
    private sagaService: SagaService,
    @InjectBot() private bot: Telegraf<BotContext>,
  ) {}

  async handle(saga: TtSagaTgSend): Promise<void> {
    const { metadata } = saga;

    await this.bot.telegram.sendMessage(
      metadata.tgChatId,
      `I've just downloaded tiktok, check it out`,
      {
        reply_to_message_id: metadata.messageId,
      },
    );

    await this.bot.telegram.sendVideo(metadata.tgChatId, {
      url: metadata.upload.presignedUrl,
    });

    this.logger.log({
      message: 'TT sent to user',
      ...metadata,
    });

    await this.sagaService.complete(saga.id);
  }
}
