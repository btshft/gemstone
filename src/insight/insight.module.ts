import { CacheModule, Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { IgModule } from 'src/ig/ig.module';
import { InsightController } from './insight.controller';
import { FollowersInsight } from './insight.followers.service';

@Module({
  controllers: [InsightController],
  imports: [
    IgModule,
    PrismaModule,
    CacheModule.register({
      max: 10, // items
      ttl: 300, // seconds
    }),
  ],
  providers: [FollowersInsight],
  exports: [FollowersInsight],
})
export class InsightModule {}
