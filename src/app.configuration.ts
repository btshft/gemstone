import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT) || 8080,
  queue: {
    host: process.env.QUEUE_HOST || 'localhost',
    port: parseInt(process.env.QUEUE_PORT) || 6379,
    password: process.env.QUEUE_PASSWORD,
  },
}));
