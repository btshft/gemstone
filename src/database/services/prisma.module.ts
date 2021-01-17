import { Module } from '@nestjs/common';
import { Prisma } from './prisma';

@Module({
  exports: [Prisma],
  providers: [Prisma],
})
export class PrismaModule {}
