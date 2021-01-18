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

    const role = await client.role.findFirst({
      where: { name: RoleName.Administrator },
    });

    for (const id of admins) {
      const existing = await client.user.findUnique({
        where: { telegramUserId: String(id) },
      });

      if (existing) {
        console.log({
          runner: runner.name,
          message: `Skip admin user ${id}`,
        });
        continue;
      }

      await client.user.create({
        data: {
          telegramUserId: String(id),
          telegramUsername: '<unknown>',
          roles: {
            connect: {
              id: role.id,
            },
          },
        },
      });
    }
  },
};

export default runner;
