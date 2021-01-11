import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import botConfiguration from '../bot.configuration';
import { AdministrationScene } from './administration/administration.scene';
import { ErrorScene } from './error.scene';
import { InfoScene } from './info.scene';
import { StartScene } from './start.scene';

@Module({
  imports: [ConfigModule.forFeature(botConfiguration)],
  providers: [StartScene, AdministrationScene, ErrorScene, InfoScene],
})
export class ScenesModule {}
