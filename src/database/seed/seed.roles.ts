import { PrismaClient, Role, RoleName } from '@prisma/client';
import { ISeedRunner } from './seeder';

const roles: Partial<Role>[] = [
  {
    name: RoleName.Administrator,
  },
  {
    name: RoleName.User,
  },
];

const runner: ISeedRunner = {
  name: 'roles',
  async run(client: PrismaClient): Promise<void> {
    for (const role of roles) {
      const existing = await client.role.findFirst({
        where: { name: role.name },
      });

      if (existing) {
        await client.role.update({
          where: {
            id: existing.id,
          },
          data: { ...role },
        });
      } else {
        await client.role.create({
          data: { ...role },
        });
      }
    }
  },
};

export default runner;
