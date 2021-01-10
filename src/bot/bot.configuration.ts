import { registerAs } from '@nestjs/config';

export default registerAs('bot', () => ({
  webhook: {
    enabled: !!process.env.WEBHOOK_ENABLE,
    domain: process.env.WEBHOOK_DOMAIN,
    path: process.env.WEBHOOK_PATH,
    port: process.env.WEBHOOK_PORT
      ? parseInt(process.env.WEBHOOK_PORT)
      : undefined,
  },
  token: process.env.BOT_TOKEN,
}));
