import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActionsModule } from 'src/actions/actions.module';
import { IgModule } from 'src/ig/ig.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import botConfiguration from '../bot.configuration';
import { AdministrationChallengeScene } from './administration/administration.challenge.scene';
import { AdministrationScene } from './administration/administration.scene';
import { AdministrationStateScene } from './administration/administration.state.scene';
import { ErrorScene } from './error.scene';
import { InfoScene } from './me.scene';
import { NotificationsScene } from './notifications.scene';
import { StartScene } from './start.scene';
import { StoriesRequestScene } from './stories/stories.request.scene';
import { StoriesScene } from './stories/stories.scene';

@Module({
  imports: [
    ConfigModule.forFeature(botConfiguration),
    IgModule,
    ActionsModule,
    NotificationsModule,
  ],
  providers: [
    StartScene,
    AdministrationScene,
    AdministrationStateScene,
    AdministrationChallengeScene,
    ErrorScene,
    InfoScene,
    NotificationsScene,
    StoriesScene,
    StoriesRequestScene,
  ],
})
export class ScenesModule {}
