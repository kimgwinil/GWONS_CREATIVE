import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentUpdate } from './entities/content-update.entity';
import { ContentUpdatesController } from './content-updates.controller';
import { ContentUpdatesService } from './content-updates.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContentUpdate])],
  controllers: [ContentUpdatesController],
  providers: [ContentUpdatesService],
  exports: [ContentUpdatesService],
})
export class ContentUpdatesModule {}
