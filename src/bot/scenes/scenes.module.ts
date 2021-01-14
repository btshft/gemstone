import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IgModule } from 'src/ig/ig.module';
import { StoriesQueueModule } from 'src/queue/stories/stories.queue.module';
import botConfiguration from '../bot.configuration';
import { AdministrationScene } from './administration/administration.scene';
import { AdministrationStateScene } from './administration/administration.state.scene';
import { ErrorScene } from './error.scene';
import { InfoScene } from './me.scene';
import { StartScene } from './start.scene';
import { StoriesPendingScene } from './stories/stories.pending.scene';
import { StoriesRequestScene } from './stories/stories.request.scene';
import { StoriesScene } from './stories/stories.scene';

@Module({
  imports: [
    ConfigModule.forFeature(botConfiguration),
    IgModule,
    StoriesQueueModule,
  ],
  providers: [
    StartScene,
    AdministrationScene,
    AdministrationStateScene,
    ErrorScene,
    InfoScene,
    StoriesScene,
    StoriesRequestScene,
    StoriesPendingScene,
  ],
})
export class ScenesModule {}
