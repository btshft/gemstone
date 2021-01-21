import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/services/prisma.module';
import { FavoritesService } from './favorites.service';

@Module({
  providers: [FavoritesService],
  exports: [FavoritesService],
  imports: [PrismaModule],
})
export class FavoritesModule {}
