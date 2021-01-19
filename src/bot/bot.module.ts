import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import botConfiguration from './bot.configuration';
import { BotUpdate } from './bot.update';
import { ScenesModule } from './scenes/scenes.module';
import { wizard } from './dialog-wizard/dialog.wizard';
import { appContext } from './app-context/app.context';
import { PrismaModule } from 'src/database/services/prisma.module';
import { Prisma } from 'src/database/services/prisma';
import { UserModule } from 'src/user/user.module';
import { fsm } from './fsm/fsm.context';

@Module({
  imports: [
    UserModule,
    ScenesModule,
    ConfigModule.forFeature(botConfiguration),
    TelegrafModule.forRootAsync({
      inject: [botConfiguration.KEY, Prisma],
      imports: [ConfigModule.forFeature(botConfiguration), PrismaModule],
      useFactory: async (
        config: ConfigType<typeof botConfiguration>,
        prisma: Prisma,
      ) => {
        return {
          token: config.token,
          middlewares: [session(), wizard(), appContext(prisma), fsm()],
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
