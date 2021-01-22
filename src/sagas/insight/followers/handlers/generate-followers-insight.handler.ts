import { Injectable, Logger } from '@nestjs/common';
import { IgUser } from '@prisma/client';
import {
  AccountFollowersFeedResponseUsersItem,
  AccountFollowingFeedResponseUsersItem,
} from 'instagram-private-api';
import { uniq } from 'lodash';
import { Prisma } from 'src/database/services/prisma';
import { IgService } from 'src/ig/ig.service';
import { FollowersInsight } from 'src/insight/insight.followers.service';
import { FollowersInsightPayload } from 'src/insight/insight.payloads';
import { SagaService } from 'src/sagas/saga.service';
import { SagaHandler } from 'src/sagas/saga.types';
import {
  FollowersInsightSagaGenerate,
  FollowersInsightSagaSend,
} from '../saga.insight-followers';

const changes = (
  current: string[],
  update: string[],
): { added: string[]; removed: string[] } => {
  const added = update.filter((u) => !current.includes(u));
  const removed = current.filter((cu) => !update.includes(cu));

  return {
    added: added,
    removed: removed,
  };
};

@Injectable()
// eslint-disable-next-line prettier/prettier
export class GenerateFollowersInsightHandler implements SagaHandler<FollowersInsightSagaGenerate> {
  private readonly logger = new Logger(GenerateFollowersInsightHandler.name);

  constructor(
    private readonly sagaService: SagaService,
    private readonly prisma: Prisma,
    private readonly ig: IgService,
    private readonly insight: FollowersInsight,
  ) {}

  async handle(saga: FollowersInsightSagaGenerate): Promise<void> {
    const { metadata } = saga;
    const { followers, following } = metadata;

    let requester = await this.prisma.igUser.findUnique({
      where: {
        pk: String(metadata.igUserId),
      },
      include: {
        followed: {
          select: {
            pk: true,
          },
        },
        following: {
          select: {
            pk: true,
          },
        },
      },
    });

    if (!requester) {
      const user = await this.ig.userInfo(metadata.igUserId);
      if (!user) {
        throw new Error(`IG user with id '${metadata.igUserId}' not found`);
      }

      requester = await this.prisma.igUser.create({
        data: {
          pk: String(metadata.igUserId),
          username: user.username,
          fullname: user.full_name,
          profilePicUrl: user.profile_pic_url,
        },
        include: {
          followed: true,
          following: true,
        },
      });
    }

    const currentFollowers = requester ? requester.followed : [];
    const currentFollowings = requester ? requester.following : [];

    const { added: followersAdded, removed: followersRemoved } = changes(
      currentFollowers.map((r) => r.pk),
      followers.map((f) => String(f.pk)),
    );

    const { added: followingsAdded, removed: followingsRemoved } = changes(
      currentFollowings.map((r) => r.pk),
      following.map((f) => String(f.pk)),
    );

    // Users that are followed by requester and not following requester back
    const notFollowedBy = following.filter(
      (fg) => !followers.some((fs) => fg.pk == fs.pk),
    );

    // Users that are following requester but not followed back
    const notFollowingBack = followers.filter(
      (fs) => !following.some((fg) => fg.pk == fs.pk),
    );

    await this.updateRelations(
      followers,
      followersAdded,
      following,
      followingsAdded,
      requester,
      followersRemoved,
      followingsRemoved,
    );

    // Followers that unsubscribed from previous check
    // but that are still followed by person.
    const newUnfollowers = followersRemoved.filter((u) =>
      following.some((fi) => String(fi.pk) === u),
    );

    const newUnfollowings = [
      // New followers that are subscribed to person from prev. check
      // but didn't get sub. back
      ...followersAdded.filter(
        (u) => !following.some((fi) => String(fi.pk) === u),
      ),
      // Old followings that are still follow our person
      // while he's decided to drop them away
      ...followingsRemoved.filter((u) =>
        followers.some((fi) => String(fi.pk) === u),
      ),
    ];

    const payload: FollowersInsightPayload = {
      newFollowers: followersAdded,
      newFollowings: followingsAdded,
      newUnfollowers: newUnfollowers,
      newUnfollowings: uniq(newUnfollowings),
      notFollowedBy: notFollowedBy.map((r) => String(r.pk)),
      notFollowingBack: notFollowingBack.map((r) => String(r.pk)),
      surface: {
        username: metadata.igUsername,
        drift: metadata.drift,
      },
    };

    const groupId = `${metadata.userId}:${metadata.igUserId}`;
    const insightId = await this.insight.create(
      metadata.userId,
      groupId,
      payload,
    );

    delete metadata.followers;
    delete metadata.following;

    this.logger.log({
      message: 'Insight generation stats',
      new_unfollowers: newUnfollowers.length,
      new_unfollowings: newUnfollowings.length,
      new_followers: followersAdded.length,
      new_followings: followingsRemoved.length,
      not_followed_by: notFollowedBy.length,
      not_following_back: notFollowingBack.length,
      username: `@${metadata.igUsername}`,
      drift: metadata.drift,
    });

    await this.sagaService.move<FollowersInsightSagaSend>(
      saga.id,
      'insight:followers:send',
      {
        ...metadata,
        insightId: insightId,
      },
    );
  }

  private async updateRelations(
    followers: AccountFollowersFeedResponseUsersItem[],
    followersAdded: string[],
    following: AccountFollowingFeedResponseUsersItem[],
    followingsAdded: string[],
    requester: IgUser,
    followersRemoved: string[],
    followingsRemoved: string[],
  ): Promise<void> {
    const followersToAddOrUpdate = followers.filter((f) =>
      followersAdded.includes(String(f.pk)),
    );

    const followingsToAddOrUpdate = following.filter((f) =>
      followingsAdded.includes(String(f.pk)),
    );

    await this.prisma.igUser.update({
      where: {
        id: requester.id,
      },
      data: {
        followed: {
          connectOrCreate: followersToAddOrUpdate.map((fa) => ({
            create: {
              pk: String(fa.pk),
              username: fa.username,
              fullname: fa.full_name,
              profilePicUrl: fa.profile_pic_url,
            },
            where: {
              pk: String(fa.pk),
            },
          })),
          disconnect: followersRemoved.map((fr) => ({
            pk: fr,
          })),
        },
        following: {
          connectOrCreate: followingsToAddOrUpdate.map((fa) => ({
            create: {
              pk: String(fa.pk),
              username: fa.username,
              fullname: fa.full_name,
              profilePicUrl: fa.profile_pic_url,
            },
            where: {
              pk: String(fa.pk),
            },
          })),
          disconnect: followingsRemoved.map((fi) => ({
            pk: fi,
          })),
        },
      },
    });
  }
}
