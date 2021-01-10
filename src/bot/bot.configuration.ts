import { registerAs } from '@nestjs/config';

const parseAdmins = (value?: string): number[] => {
  if (value) {
    return value
      .split(';')
      .map((v) => parseInt(v))
      .filter((v) => !!v);
  }

  return [];
};

export default registerAs('bot', () => ({
  auth: {
    admins: parseAdmins(process.env.BOT_ADMINS),
  },
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
