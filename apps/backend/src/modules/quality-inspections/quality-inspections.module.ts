import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityInspection } from './entities/quality-inspection.entity';
import { QualityInspectionsService } from './quality-inspections.service';
import { QualityInspectionsController } from './quality-inspections.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QualityInspection])],
  controllers: [QualityInspectionsController],
  providers: [QualityInspectionsService],
  exports: [QualityInspectionsService],
})
export class QualityInspectionsModule {}
