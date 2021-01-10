import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import botConfiguration from './bot.configuration';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
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
