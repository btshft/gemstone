import { Injectable, Logger } from '@nestjs/common';
import { delay } from 'bluebird';
import {
  AccountFollowersFeedResponseUsersItem,
  AccountFollowingFeedResponseUsersItem,
} from 'instagram-private-api';
import { difference, orderBy, random, uniqBy } from 'lodash';
import { IgService } from 'src/ig/ig.service';
import { SagaService } from 'src/sagas/saga.service';
import { SagaHandler } from 'src/sagas/saga.types';
import { iterator } from 'src/utils/observable.async-iterator';
import {
  FollowersInsightSaga,
  FollowersInsightSagaGetFollowers,
} from '../saga.insight-followers';

const MAX_RECEIVE_ITERATIONS = 10;
const MIN_RECEIVE_ITERATIONS = 3;
const MAX_FOLLOWERS_ALLOWED = 2000;

@Injectable()
// eslint-disable-next-line prettier/prettier
export class IgGetFollowersHandler implements SagaHandler<FollowersInsightSagaGetFollowers> {
  private readonly logger = new Logger(IgGetFollowersHandler.name);

  constructor(
    private readonly sagaService: SagaService,
    private readonly ig: IgService,
  ) {}

  async handle(saga: FollowersInsightSagaGetFollowers): Promise<void> {
    const { metadata } = saga;
    const { following, followers, drift } = await this.receive(
      metadata.igUserId,
    );

    this.logger.log({
      message: 'User followers loaded',
      initiator_id: metadata.userId,
      requested_user: metadata.igUsername,
      followers: followers.length,
      following: following.length,
    });

    const orderedFollowing = uniqBy(
      orderBy(following, (o) => o.username, 'asc'),
      (o) => o.pk,
    );

    const orderedFollowers = uniqBy(
      orderBy(followers, (o) => o.username, 'asc'),
      (o) => o.pk,
    );

    await this.sagaService.move<FollowersInsightSaga>(
      saga.id,
      'insight:followers:generate',
      {
        ...metadata,
        followers: orderedFollowers,
        following: orderedFollowing,
        drift: drift,
      },
    );
  }

  async receive(
    userId: string | number,
  ): Promise<{
    followers: AccountFollowersFeedResponseUsersItem[];
    following: AccountFollowingFeedResponseUsersItem[];
    drift: boolean;
  }> {
    let followers: AccountFollowersFeedResponseUsersItem[] = [];
    let following: AccountFollowingFeedResponseUsersItem[] = [];
    let expectedFollowers = 0;
    let expectedFollowing = 0;
    let realFollowings = 0;
    let realFollowers = 0;
    let iteration = 0;

    const stop = (): boolean => {
      return (
        iteration === MAX_RECEIVE_ITERATIONS ||
        (iteration >= MIN_RECEIVE_ITERATIONS &&
          expectedFollowers === realFollowers &&
          expectedFollowing == realFollowings)
      );
    };

    do {
      iteration += 1;

      if (iteration != 1) {
        await delay(random(1_000, 5_000));
      }

      let _followers: AccountFollowersFeedResponseUsersItem[] = [];
      let _following: AccountFollowingFeedResponseUsersItem[] = [];

      const followers$ = await this.ig.followers$(userId);
      for await (const chunk of iterator(followers$)) {
        _followers = [..._followers, ...chunk];
      }

      await delay(random(800, 1_200));

      const following$ = await this.ig.following$(userId);
      for await (const chunk of iterator(following$)) {
        _following = [..._following, ...chunk];
      }

      if (iteration == 1) {
        expectedFollowers = _followers.length;
        expectedFollowing = _following.length;
      }

      if (
        _following.length > MAX_FOLLOWERS_ALLOWED ||
        _followers.length > MAX_FOLLOWERS_ALLOWED
      ) {
        throw new Error('Too many followers or following');
      }

      const diff = {
        followers: difference(
          followers.map((r) => r.pk),
          _followers.map((r) => r.pk),
        ),
        following: difference(
          following.map((r) => r.pk),
          _following.map((r) => r.pk),
        ),
      };

      followers = uniqBy([...followers, ..._followers], (o) => o.pk);
      following = uniqBy([...following, ..._following], (o) => o.pk);

      realFollowings = following.length;
      realFollowers = followers.length;

      this.logger.log({
        message: 'Receive followers',
        iteration: iteration,
        local: {
          followers: _followers.length,
          following: _following.length,
        },
        global: {
          followers: followers.length,
          following: following.length,
        },
        difference: diff,
        count: {
          expected: {
            followers: expectedFollowers,
            following: expectedFollowing,
          },
          real: {
            followers: followers.length,
            following: following.length,
          },
        },
      });
    } while (!stop());

    return {
      followers: followers,
      following: following,
      drift:
        expectedFollowing != realFollowings ||
        expectedFollowers != realFollowers,
    };
  }
}
