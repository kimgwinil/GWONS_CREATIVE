import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayoutSketch } from './entities/layout-sketch.entity';
import { LayoutSketchesService } from './layout-sketches.service';
import { LayoutSketchesController } from './layout-sketches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LayoutSketch])],
  controllers: [LayoutSketchesController],
  providers: [LayoutSketchesService],
  exports: [LayoutSketchesService],
})
export class LayoutSketchesModule {}
