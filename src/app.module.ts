import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import botConfiguration from './bot/bot.configuration';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    BotModule,
    ConfigModule.forRoot({
      load: [botConfiguration],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
