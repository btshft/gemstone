import { Injectable } from '@nestjs/common';
import { BotContext } from 'src/bot/bot.context';
import { SagaService } from 'src/sagas/saga.service';

@Injectable()
export class StoriesRequester {
  constructor(private readonly sagaService: SagaService) {}

  async requestStories(
    bot: BotContext,
    userId: string,
    username: string,
  ): Promise<void> {
    // eslint-disable-next-line prettier/prettier
    const { app: { user } } = bot;
    const activityId = `stories:request:${bot.from.id}:${userId}`;
    const activeExists = await this.sagaService.activeExists(
      user.id,
      activityId,
    );

    if (activeExists) {
      await bot.reply(
        `Could not load @${username} stories, because I'm already working on his stories. Stay tuned ⚡️`,
      );

      return;
    }

    await this.sagaService.create({
      metadata: {
        igUserId: userId,
        igUsername: username,
        tgChatId: bot.chat.id,
        userId: user.id,
      },
      state: 'ig:get-json',
      type: 'saga:stories:request',
      initiatorId: user.id,
      activityId: activityId,
    });

    await bot.reply(
      `Got it! I'm off to get the @${username} stories 👻\nWill reach you as soon as I download them.`,
    );
  }
}
