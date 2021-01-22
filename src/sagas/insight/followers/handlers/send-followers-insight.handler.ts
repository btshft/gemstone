import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { FollowersInsight } from 'src/insight/insight.followers.service';
import { SagaService } from 'src/sagas/saga.service';
import { SagaHandler } from 'src/sagas/saga.types';
import Telegraf from 'telegraf';
import { FollowersInsightSagaSend } from '../saga.insight-followers';

@Injectable()
// eslint-disable-next-line prettier/prettier
export class SendFollowersInsightHandler implements SagaHandler<FollowersInsightSagaSend> {
  private readonly logger = new Logger(SendFollowersInsightHandler.name);

  constructor(
    private readonly insight: FollowersInsight,
    private readonly sagaService: SagaService,
    @InjectBot() private readonly bot: Telegraf<BotContext>,
  ) {}

  async handle(saga: FollowersInsightSagaSend): Promise<void> {
    const { metadata } = saga;
    const token = await this.insight.craftToken(metadata.insightId);
    const url = this.insight.createUrl(
      metadata.userId,
      metadata.insightId,
      token.token,
    );

    await this.bot.telegram.sendMessage(
      metadata.tgChatId,
      `Insight for user @${metadata.igUsername} ready!\nYou can check it here <a href='${url}'>Insight 💫</a>`,
      {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      },
    );

    this.logger.log({
      message: 'Insight sended to user',
      user_id: metadata.userId,
      chat_it: metadata.tgChatId,
      insight_it: metadata.insightId,
    });

    await this.sagaService.complete(saga.id);
  }
}
