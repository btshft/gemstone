import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import botConfiguration from './bot.configuration';
import { BotUpdate } from './bot.update';
import { StartScene } from './scenes/start.scene';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [botConfiguration.KEY],
      imports: [ConfigModule.forFeature(botConfiguration)],
      useFactory: async (config: ConfigType<typeof botConfiguration>) => {
        return {
          token: config.token,
          middlewares: [session()],
          launchOptions: {
            webhook: {
              domain: config.webhook.domain,
              hookPath: config.webhook.path,
              port: config.webhook.port,
            },
          },
        };
      },
    }),
  ],
  providers: [BotUpdate, StartScene],
})
export class BotModule {}
