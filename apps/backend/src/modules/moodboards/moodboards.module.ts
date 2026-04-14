import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moodboard } from './entities/moodboard.entity';
import { MoodboardsService } from './moodboards.service';
import { MoodboardsController } from './moodboards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Moodboard])],
  controllers: [MoodboardsController],
  providers: [MoodboardsService],
  exports: [MoodboardsService],
})
export class MoodboardsModule {}
