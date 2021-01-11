import { registerAs } from '@nestjs/config';

export default registerAs('ig', () => ({
  seed: process.env.IG_SEED || 'default.seed',
  username: process.env.IG_USERNAME,
  password: process.env.IG_PASSWORD,
  proxyUrl: process.env.IG_PROXY_URL,
}));
