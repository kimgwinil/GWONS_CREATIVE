import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteVisualization } from './entities/site-visualization.entity';
import { SiteVisualizationsService } from './site-visualizations.service';
import { SiteVisualizationsController } from './site-visualizations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteVisualization])],
  controllers: [SiteVisualizationsController],
  providers: [SiteVisualizationsService],
  exports: [SiteVisualizationsService],
})
export class SiteVisualizationsModule {}
