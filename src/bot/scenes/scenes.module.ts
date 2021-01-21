import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IgModule } from 'src/ig/ig.module';
import { SagaModule } from 'src/sagas/saga.module';
import { UserModule } from 'src/user/user.module';
import botConfiguration from '../bot.configuration';
import { KeyboardBuilder } from '../dialog/keyboard.builder';
import { AdministrationChallengeScene } from './administration/administration.challenge.scene';
import { AdministrationScene } from './administration/administration.scene';
import { AdministrationStateScene } from './administration/administration.state.scene';
import { ErrorScene } from './error.scene';
import { ProfileDialogFactory } from './start/dialogs/profile.dialog.factory';
import { FavoritesModule } from 'src/favorites/favorites.module';
import { StartScene } from './start/start.scene';
import { FavoritesDialogFactory } from './start/dialogs/favorites.dialog.factory';
import { StoriesRequester } from './start/services/stories.requester';

@Module({
  imports: [
    ConfigModule.forFeature(botConfiguration),
    IgModule,
    SagaModule,
    UserModule,
    FavoritesModule,
  ],
  providers: [
    StartScene,
    AdministrationScene,
    AdministrationStateScene,
    AdministrationChallengeScene,
    ErrorScene,
    KeyboardBuilder,
    ProfileDialogFactory,
    FavoritesDialogFactory,
    StoriesRequester,
  ],
})
export class ScenesModule {}
