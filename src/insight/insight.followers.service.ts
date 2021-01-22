import { Insight, InsightAccessToken } from '@prisma/client';
import { createHash } from 'crypto';
import { Prisma } from 'src/database/services/prisma';
import { formatUtc, utc } from 'src/utils/date-time';
import { FollowersInsightPayload } from './insight.payloads';
import { FollowersInsightModel } from './insight.types';
import { v4 as uuid } from 'uuid';
import { addHours } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';

export const FOLLOWERS_INSIGHT_LIFETIME_HOURS = 6;

@Injectable()
export class FollowersInsight {
  constructor(private readonly prisma: Prisma) {}

  createUrl(userId: string, insightId: string, token: string): string {
    return encodeURI(
      `${process.env.API_BASE_PUBLIC_URL}/insight/followers?is=${insightId}&tr=${token}&ui=${userId}`,
    );
  }

  async getLastCreatedBy(userId: string): Promise<Insight> {
    return await this.prisma.insight.findFirst({
      where: {
        initiatorId: userId,
        type: 'Followers',
        expiration: {
          gt: utc(),
        },
        tokens: {
          some: {
            expiration: {
              gt: utc(),
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUnexpired(
    groupId: string,
    userId: string,
  ): Promise<Insight & { tokens: InsightAccessToken[] }> {
    return await this.prisma.insight.findFirst({
      where: {
        initiatorId: userId,
        groupId: groupId,
        type: 'Followers',
        expiration: {
          gt: utc(),
        },
        tokens: {
          some: {
            expiration: {
              gt: utc(),
            },
          },
        },
      },
      select: {
        content: true,
        createdAt: true,
        expiration: true,
        groupId: true,
        initiator: true,
        id: true,
        initiatorId: true,
        type: true,
        tokens: {
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    userId: string,
    groupId: string,
    payload: FollowersInsightPayload,
  ): Promise<string> {
    const { id } = await this.prisma.insight.create({
      data: {
        content: payload,
        type: 'Followers',
        groupId: groupId,
        initiator: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return id;
  }

  async read(insightId: string, token: string): Promise<FollowersInsightModel> {
    const tokenRef = await this.verifyToken(token, insightId);
    if (!tokenRef) {
      throw new Error('Access token is invalid');
    }

    const insight = await this.prisma.insight.findUnique({
      where: {
        id: insightId,
      },
    });

    const payload: FollowersInsightPayload = <any>insight.content;
    const notFollowedBy = await this.prisma.igUser.findMany({
      where: {
        pk: {
          in: payload.notFollowedBy || [],
        },
      },
    });

    const nowFollowingBack = await this.prisma.igUser.findMany({
      where: {
        pk: {
          in: payload.notFollowingBack || [],
        },
      },
    });

    const notFollowingBackExt = nowFollowingBack.map((nf) => ({
      ...nf,
      seen: !payload.newUnfollowings.includes(nf.pk),
    }));

    const notFollowedByExt = notFollowedBy.map((nf) => ({
      ...nf,
      seen: !payload.newUnfollowers.includes(nf.pk),
    }));

    return {
      expireAt: formatUtc(tokenRef.expiration),
      generatedAt: formatUtc(insight.createdAt),
      notFollowedBy: orderBy(notFollowedByExt, (u) => u.seen, 'asc'),
      notFollowingBack: orderBy(notFollowingBackExt, (u) => u.seen, 'asc'),
      surface: {
        username: payload.surface.username,
        drift: payload.surface.drift,
      },
    };
  }

  async craftToken(insightId: string): Promise<InsightAccessToken> {
    const insight = await this.prisma.insight.count({
      where: {
        id: insightId,
      },
    });

    if (!insight) {
      throw new Error('Insight not found');
    }

    const token = uuid();
    const tokenValue = createHash('sha256').update(token).digest('hex');
    const expiration = addHours(utc(), FOLLOWERS_INSIGHT_LIFETIME_HOURS);

    await this.prisma.insight.update({
      where: {
        id: insightId,
      },
      data: {
        expiration: expiration,
      },
    });

    return await this.prisma.insightAccessToken.create({
      data: {
        insight: {
          connect: {
            id: insightId,
          },
        },
        token: tokenValue,
        expiration: expiration,
      },
    });
  }

  async verifyToken(
    token: string,
    insightId: string,
  ): Promise<InsightAccessToken | undefined> {
    const insight = await this.prisma.insight.count({
      where: {
        id: insightId,
      },
    });

    if (!insight) {
      return undefined;
    }

    const tokenRef = await this.prisma.insightAccessToken.findFirst({
      where: {
        insightId: insightId,
        token: token,
      },
    });

    if (!tokenRef || tokenRef.expiration < utc()) {
      return undefined;
    }

    return tokenRef;
  }
}
