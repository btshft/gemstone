import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IgModule } from 'src/ig/ig.module';
import { SagaModule } from 'src/sagas/saga.module';
import { UserModule } from 'src/user/user.module';
import botConfiguration from '../bot.configuration';
import { AdministrationChallengeScene } from './administration/administration.challenge.scene';
import { AdministrationScene } from './administration/administration.scene';
import { AdministrationStateScene } from './administration/administration.state.scene';
import { ErrorScene } from './error.scene';
import { StartScene } from './start.scene';
import { StoriesRequestScene } from './stories/stories.request.scene';
import { StoriesScene } from './stories/stories.scene';

@Module({
  imports: [
    ConfigModule.forFeature(botConfiguration),
    IgModule,
    SagaModule,
    UserModule,
  ],
  providers: [
    StartScene,
    AdministrationScene,
    AdministrationStateScene,
    AdministrationChallengeScene,
    ErrorScene,
    StoriesScene,
    StoriesRequestScene,
  ],
})
export class ScenesModule {}
