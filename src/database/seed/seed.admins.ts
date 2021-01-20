import { PrismaClient, RoleName } from '@prisma/client';
import { ISeedRunner } from './seeder';

const runner: ISeedRunner = {
  name: 'admins',
  async run(client: PrismaClient): Promise<void> {
    const admins = process.env.BOT_ADMINS.split(';')
      .map((v) => parseInt(v))
      .filter((v) => !!v);

    if (!admins || !admins.length) {
      throw new Error('Unable to find any admninistrator');
    }

    const roles = await client.role.findMany({
      where: {
        name: {
          in: [RoleName.Administrator, RoleName.User],
        },
      },
    });

    for (const id of admins) {
      await client.user.upsert({
        where: {
          telegramUserId: String(id),
        },
        create: {
          telegramUserId: String(id),
          telegramUsername: '<unknown>',
          roles: {
            connect: roles.map((r) => ({
              id: r.id,
            })),
          },
        },
        update: {
          roles: {
            connect: roles.map((r) => ({
              id: r.id,
            })),
          },
        },
      });
    }
  },
};

export default runner;
