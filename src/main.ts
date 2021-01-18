import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getBotToken } from 'nestjs-telegraf';
import Telegraf from 'telegraf';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.setGlobalPrefix('api');

  const configService = app.get<ConfigService>(ConfigService);
  const { enabled, path } = configService.get('bot.webhook');
  const { port } = configService.get('app');

  const config = new DocumentBuilder()
    .setTitle('Gemstone')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Api-Key',
        description: 'API Key',
      },
      'X-Api-Key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  if (enabled) {
    const bot: Telegraf<any> = app.get(getBotToken());
    app.use(bot.webhookCallback(path));
  }

  app.listen(port, '0.0.0.0');
}

bootstrap();
