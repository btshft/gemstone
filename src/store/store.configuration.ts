import { registerAs } from '@nestjs/config';

export default registerAs('store', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379, // default value
    password: process.env.REDIS_PASSWORD,
    prefix: process.env.REDIS_PREFIX || 'state',
  },
}));
