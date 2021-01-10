import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { getBotToken } from 'nestjs-telegraf';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get<ConfigService>(ConfigService);
  const { enabled, path } = configService.get('bot.webhook');
  const { port } = configService.get('app');

  if (enabled) {
    const bot = app.get(getBotToken());
    app.use(bot.webhookCallback(path));
  }

  app.listen(port);
}

bootstrap();
