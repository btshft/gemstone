import { Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { BotContext } from 'src/bot/bot.context';
import { FollowersInsight } from 'src/insight/insight.followers.service';
import { FollowersInsightSagaGetFollowers } from 'src/sagas/insight/followers/saga.insight-followers';
import { SagaService } from 'src/sagas/saga.service';
import { RequestStoriesSagaGetJson } from 'src/sagas/stories/request/saga.request-stories';
import { formatUtc, utc } from 'src/utils/date-time';

const MIN_CREATION_INTERVAL_MINUTES = 10;

@Injectable()
export class StoriesRequester {
  constructor(
    private readonly sagaService: SagaService,
    private readonly insighs: FollowersInsight,
  ) {}

  async requestFollowersInsight(
    bot: BotContext,
    userId: string,
    username: string,
  ): Promise<void> {
    // eslint-disable-next-line prettier/prettier
    const { app: { user } } = bot;
    const activityId = `followers:insight:${bot.from.id}:${user.id}`;
    const activeExists = await this.sagaService.activeExists(
      user.id,
      activityId,
    );

    if (activeExists) {
      await bot.reply(
        `Could not load @${username} followers insight, because I'm already busy with other similar task. Stay tuned ⚡️`,
      );

      return;
    }

    const groupId = `${user.id}:${userId}`;
    const lastByGroupId = await this.insighs.getUnexpired(groupId, user.id);
    if (lastByGroupId) {
      const [token] = lastByGroupId.tokens;
      const url = this.insighs.createUrl(
        user.id,
        lastByGroupId.id,
        token.token,
      );

      await bot.reply(
        `Here's link to the last @${username} insight - <a href='${url}'>Insight</a>.\nIt would be possible to generate a new one for that user after ${formatUtc(
          lastByGroupId.expiration,
        )} UTC 🙄`,
        {
          parse_mode: 'HTML',
        },
      );

      return;
    }

    const lastCreated = await this.insighs.getLastCreatedBy(user.id);
    if (
      lastCreated &&
      addMinutes(lastCreated.createdAt, MIN_CREATION_INTERVAL_MINUTES) > utc()
    ) {
      await bot.reply(
        `Please wait at least ${MIN_CREATION_INTERVAL_MINUTES} minutes before requesting a new insight 😣`,
      );
      return;
    }

    await this.sagaService.create<FollowersInsightSagaGetFollowers>({
      metadata: {
        igUserId: userId,
        igUsername: username,
        tgChatId: bot.chat.id,
        userId: user.id,
      },
      state: 'ig:followers:get',
      type: 'saga:insight:followers',
      initiatorId: user.id,
      activityId: activityId,
    });

    await bot.reply(
      `Roger that!\nI'm going to switch gears and get @${username} followers insight for you as soon as possible. Will notify you soon ⚡️`,
    );
  }

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

    await this.sagaService.create<RequestStoriesSagaGetJson>({
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
