import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { UserService } from './user.service';

@Module({
  exports: [UserService],
  imports: [PrismaModule],
  providers: [UserService],
})
export class UserModule {}
