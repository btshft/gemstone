import { Injectable } from '@nestjs/common';
import { Favorite } from '@prisma/client';
import { createHash } from 'crypto';
import { Prisma } from 'src/database/services/prisma';
import { Drop } from 'src/utils/utility.types';

export type FavoriteTypes = 'favories:get:stories';
export type FavoriteType<T extends FavoriteTypes> = T;

type _Favorites = {
  ['favories:get:stories']: {
    parameters: {
      username: string;
      userId: string;
    };
    type: FavoriteType<'favories:get:stories'>;
  };
};

export type FavoriteGetStories = Drop<
  Favorite,
  'type' | 'parameters' | 'hash'
> &
  _Favorites['favories:get:stories'];

export type CreateFavoriteGetStories = Drop<
  FavoriteGetStories,
  'createdAt' | 'id'
>;

export type AnyFavorite = FavoriteGetStories;
export type CreateAnyFavorite = CreateFavoriteGetStories;

const FAVORITES_LIMIT_PER_USER = 5;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: Prisma) {}

  async getById(id: string): Promise<AnyFavorite> {
    return <any>await this.prisma.favorite.findUnique({
      where: {
        id: id,
      },
    });
  }

  async add(favorite: CreateAnyFavorite): Promise<void> {
    const hash = favorite.parameters
      ? createHash('sha256')
          .update(JSON.stringify(favorite.parameters))
          .digest('base64')
      : undefined;

    await this.prisma.favorite.create({
      data: {
        alias: favorite.alias,
        type: favorite.type,
        parameters: favorite.parameters,
        hash: hash,
        user: {
          connect: {
            id: favorite.userId,
          },
        },
      },
    });

    const count = await this.prisma.favorite.count({
      where: {
        userId: favorite.userId,
      },
    });

    if (count > FAVORITES_LIMIT_PER_USER) {
      const oldest = await this.prisma.favorite.findFirst({
        where: {
          userId: favorite.userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      await this.prisma.favorite.delete({
        where: {
          id: oldest.id,
        },
      });
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.favorite.delete({
      where: {
        id: id,
      },
    });
  }

  async get(userId: string): Promise<AnyFavorite[]> {
    const result = await this.prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return <AnyFavorite[]>(<unknown>result);
  }

  async exists(
    userId: string,
    parameters: Record<any, string>,
  ): Promise<boolean> {
    const hash = createHash('sha256')
      .update(JSON.stringify(parameters))
      .digest('base64');

    const count = await this.prisma.favorite.count({
      where: {
        hash: hash,
        userId: userId,
      },
      take: 1,
    });

    return count > 0;
  }
}
