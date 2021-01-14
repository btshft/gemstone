import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IgModule } from 'src/ig/ig.module';
import botConfiguration from '../bot.configuration';
import { AdministrationScene } from './administration/administration.scene';
import { ErrorScene } from './error.scene';
import { InfoScene } from './me.scene';
import { StartScene } from './start.scene';
import { StoriesScene } from './stories.scene';

@Module({
  imports: [ConfigModule.forFeature(botConfiguration), IgModule],
  providers: [
    StartScene,
    AdministrationScene,
    ErrorScene,
    InfoScene,
    StoriesScene,
  ],
})
export class ScenesModule {}
