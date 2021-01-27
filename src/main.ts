import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getBotToken } from 'nestjs-telegraf';
import { join } from 'path';
import { Telegraf } from 'telegraf';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const { enabled, path } = configService.get('bot.webhook');
  const { port } = configService.get('app');

  if (enabled) {
    const bot: Telegraf<any> = app.get(getBotToken());
    app.use(bot.webhookCallback(path));
  }

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.listen(port, '0.0.0.0');
}

bootstrap();
