import { PrismaClient } from '@prisma/client';
import seedAdmins from './seed.admins';
import seedRoles from './seed.roles';

export interface ISeedRunner {
  name: string;
  run(client: PrismaClient): Promise<void>;
}

const prisma = new PrismaClient();
const main = async (): Promise<void> => {
  const runners: ISeedRunner[] = [seedRoles, seedAdmins];
  console.log({
    message: 'Seeding started',
  });

  for (const runner of runners) {
    try {
      console.log({
        message: 'Runner started',
        runner: runner.name,
      });

      await runner.run(prisma);

      console.log({
        message: 'Runner finished',
        runner: runner.name,
      });
    } catch (err) {
      console.log({
        message: 'Runner failed',
        runner: runner.name,
        reason: err.message || 'unknown',
      });

      throw err;
    }
  }

  console.log({
    message: 'Seeding finished',
  });
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
