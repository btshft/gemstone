import { Injectable, Logger } from '@nestjs/common';
import { chunk, orderBy } from 'lodash';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { Prisma } from 'src/database/services/prisma';
import { SagaHandler } from 'src/sagas/saga.types';
import { indexed } from 'src/utils/helpers';
import { Telegraf } from 'telegraf';
import {
  InputFileByURL,
  InputMediaPhoto,
  InputMediaVideo,
} from 'telegraf/typings/telegram-types';
import { SagaService } from '../../../saga.service';
import {
  RequestStoriesSagaTgSend,
  S3UploadedReel,
} from '../saga.request-stories';

const MAX_ALBUM_SIZE = 10;
const VIDEO_MEDIA_TYPE = 2;

@Injectable()
export class TgSendHandler implements SagaHandler<RequestStoriesSagaTgSend> {
  private readonly logger = new Logger(TgSendHandler.name);

  constructor(
    private sagaService: SagaService,
    @InjectBot() private bot: Telegraf<BotContext>,
    private prisma: Prisma,
  ) {}

  private toMediaGroup(
    chunk: S3UploadedReel[],
  ): Array<InputMediaPhoto | InputMediaVideo> {
    return chunk.reduce<(InputMediaPhoto | InputMediaVideo)[]>((m, v) => {
      const isVideo = v.media_type === VIDEO_MEDIA_TYPE;
      const media: InputMediaPhoto | InputMediaVideo = isVideo
        ? <InputMediaVideo>{
            media: {
              url: v.s3.presignedUrl,
              filename: v.s3.key,
            },
            type: 'video',
            width: v.original_width,
            height: v.original_height,
          }
        : <InputMediaPhoto>{
            type: 'photo',
            media: {
              url: v.s3.presignedUrl,
              filename: v.s3.key,
            },
          };

      return [...m, media];
    }, []);
  }

  async handle(saga: RequestStoriesSagaTgSend): Promise<void> {
    const { metadata } = saga;
    const { tgChatId, uploads } = metadata;

    if (!uploads.length) {
      await this.bot.telegram.sendMessage(
        tgChatId,
        `Sad news, user @${metadata.igUsername} has no new stories 😒`,
      );

      await this.sagaService.complete(saga.id);
      return;
    }

    await this.bot.telegram.sendMessage(
      tgChatId,
      `I've just downloaded ${uploads.length} @${metadata.igUsername} stories for you, check them out 👻`,
    );

    const chunks = chunk(
      orderBy(uploads, (u) => u.taken_at, 'asc'),
      MAX_ALBUM_SIZE,
    );

    for (const { index, value: chunk } of indexed(chunks)) {
      const mediaGroup = this.toMediaGroup(chunk);
      if (mediaGroup.length > 1) {
        await this.bot.telegram.sendMediaGroup(metadata.tgChatId, mediaGroup);
      } else {
        const [media] = mediaGroup;
        const [story] = chunk;
        const isVideo = media.type === 'video';

        if (isVideo) {
          await this.bot.telegram.sendVideo(metadata.tgChatId, <InputFileByURL>{
            filename: story.s3.key,
            url: story.s3.presignedUrl,
          });
        } else {
          await this.bot.telegram.sendPhoto(metadata.tgChatId, <InputFileByURL>{
            filename: story.s3.key,
            url: story.s3.presignedUrl,
          });
        }
      }

      if (chunks.length > 1) {
        await this.bot.telegram.sendMessage(
          metadata.tgChatId,
          `Part ${index + 1} of ${chunks.length}`,
        );
      }
    }

    for (const reel of metadata.uploads) {
      try {
        await this.prisma.viewHistory.create({
          data: {
            igUserId: String(metadata.igUserId),
            storyKey: reel.id,
            user: {
              connect: {
                id: String(metadata.userId),
              },
            },
          },
        });
      } catch (err) {
        this.logger.error({
          message: 'Unable save view history',
          user_id: metadata.igUserId,
          story_key: reel.id,
        });
      }
    }

    this.logger.log({
      message: 'Stories sended to user',
      user_id: metadata.userId,
      chat_it: metadata.tgChatId,
      count: metadata.uploads.length,
    });

    await this.sagaService.complete(saga.id);
  }
}
