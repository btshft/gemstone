import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
  imports: [PrismaModule],
})
export class NotificationsModule {}
