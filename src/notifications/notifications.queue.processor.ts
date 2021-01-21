import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import Telegraf from 'telegraf';
import {
  NOTIFICATIONS_QUEUE_NAME,
  UserNotification,
} from './notifications.queue.types';

@Processor(NOTIFICATIONS_QUEUE_NAME)
export class NotificationsQueueProcessor {
  private readonly logger = new Logger(NotificationsQueueProcessor.name);

  constructor(@InjectBot() private readonly bot: Telegraf<BotContext>) {}

  @Process()
  async handle(job: Job<UserNotification>): Promise<void> {
    const { chatId, text, markup } = job.data;
    try {
      await this.bot.telegram.sendMessage(chatId, text, markup);
    } catch (err) {
      this.logger.error({
        message: 'Unable to send notification to user',
        chat_id: chatId,
        text: text,
        attempts_made: job.attemptsMade,
        reason: err.message || JSON.stringify(err),
      });

      throw err;
    }
  }
}
