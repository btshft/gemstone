import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { StoriesLoadModule } from 'src/ig/stories/load/stories-load.module';
import { session } from 'telegraf';
import botConfiguration from './bot.configuration';
import { BotUpdate } from './bot.update';
import { ScenesModule } from './scenes/scenes.module';

@Module({
  imports: [
    ScenesModule,
    StoriesLoadModule,
    ConfigModule.forFeature(botConfiguration),
    TelegrafModule.forRootAsync({
      inject: [botConfiguration.KEY],
      imports: [ConfigModule.forFeature(botConfiguration)],
      useFactory: async (config: ConfigType<typeof botConfiguration>) => {
        return {
          token: config.token,
          middlewares: [session()],
          launchOptions: {
            webhook: config.webhook.enabled
              ? {
                  domain: config.webhook.domain,
                  hookPath: config.webhook.path,
                  port: config.webhook.port,
                }
              : undefined,
          },
        };
      },
    }),
  ],
  providers: [BotUpdate],
})
export class BotModule {}
