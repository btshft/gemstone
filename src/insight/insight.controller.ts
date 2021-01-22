import {
  CACHE_MANAGER,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Query,
  Render,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { v4 } from 'uuid';
import { FollowersInsight } from './insight.followers.service';

@Controller('insight')
export class InsightController {
  private readonly logger = new Logger(InsightController.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly followersInsight: FollowersInsight,
  ) {}

  @Get('followers')
  @Render('insight/followers.hbs')
  async followers(
    @Query('is') insightId: string,
    @Query('tr') tokenRef: string,
    @Query('ui') userId: string,
  ): Promise<any> {
    const track = v4();

    try {
      const token = await this.followersInsight.verifyToken(
        tokenRef,
        insightId,
      );

      if (!token) {
        throw new Error('Token expired or invalid');
      }

      const cacheKey = `${insightId}:${tokenRef}:${userId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const insight = await this.followersInsight.read(insightId, tokenRef);
      if (!insight) {
        throw new Error('Unexpected null insight');
      }

      await this.cache.set(cacheKey, insight, {
        ttl: 300,
      });

      return insight;
    } catch (err) {
      this.logger.error({
        message: 'Exception while accessing insight',
        is: insightId,
        tr: tokenRef,
        ur: userId,
        track: track,
        reason: err.message || JSON.stringify(err),
      });

      throw new HttpException(
        {
          message: 'Content unavailable',
          track: track,
        },
        HttpStatus.GONE,
      );
    }
  }
}
