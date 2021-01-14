import { registerAs } from '@nestjs/config';
import { IgApiClientOptions } from './models/ig-api-client.options';

export default registerAs(
  'ig',
  (): IgApiClientOptions => ({
    seed: process.env.IG_SEED || 'default.seed',
    username: process.env.IG_USERNAME,
    password: process.env.IG_PASSWORD,
    proxy: process.env.IG_USE_PROXY
      ? {
          hostname: process.env.IG_PROXY_HOSTNAME,
          username: process.env.IG_PROXY_USERNAME,
          password: process.env.IG_PROXY_PASSWORD,
        }
      : undefined,
  }),
);
