import { Injectable, Logger } from '@nestjs/common';
import { BotContext } from 'src/bot/bot.context';
import { SagaService } from 'src/sagas/saga.service';
import { TtSagaS3Upload } from 'src/sagas/tt/saga.tt';
import { UrlService } from 'src/tt/url.service';

export const TT_SHORTURL_REGEXP = /^https:\/\/vm\.tiktok\.com\/[a-zA-Z0-9]+\/?$/i;
export const TT_VIDEOURL_REGEXP = /^https:\/\/www\.tiktok\.com\/@(?<user_id>.*)\/video\/(?<video_id>\d+)($|\/$|\?.*$)/i;

@Injectable()
export class TtRequester {
  private readonly logger = new Logger(TtRequester.name);

  constructor(
    private readonly urlService: UrlService,
    private readonly sagaService: SagaService,
  ) {}

  async request(url: string, bot: BotContext): Promise<void> {
    if (!url) return;

    const isVideoUrl = TT_VIDEOURL_REGEXP.test(url);
    if (isVideoUrl) {
      await this.requestInternal(url, bot);
      return;
    }

    const isShortUrl = TT_SHORTURL_REGEXP.test(url);
    if (isShortUrl) {
      const { resolved } = await this.urlService.expand(url);
      if (TT_VIDEOURL_REGEXP.test(resolved)) {
        await this.requestInternal(resolved, bot);
        return;
      } else {
        this.logger.log({
          message: 'TT / URL is not a video',
          original: url,
          resolved: resolved,
        });

        await bot.reply("I don't know how to handle that request 🤯");
      }
    }
  }

  private async requestInternal(
    resolvedUrl: string,
    bot: BotContext,
  ): Promise<void> {
    const { user } = bot.app;
    const { user_id, video_id } = resolvedUrl.match(TT_VIDEOURL_REGEXP).groups;
    const activityId = `${user.id}-${user_id}-${video_id}`;

    await this.sagaService.create<TtSagaS3Upload>({
      activityId: activityId,
      initiatorId: user.id,
      metadata: {
        tgChatId: bot.chat.id,
        ttId: video_id,
        ttUser: user_id,
        url: resolvedUrl,
        userId: user.id,
        messageId: bot.message.message_id,
      },
      state: 'tt:s3:upload',
      type: 'saga:tt:request',
    });

    await bot.reply(`Got it! I'm off to get that video 👻`);
  }
}
