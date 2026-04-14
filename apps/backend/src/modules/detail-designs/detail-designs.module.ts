import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetailDesign } from './entities/detail-design.entity';
import { DetailDesignsService } from './detail-designs.service';
import { DetailDesignsController } from './detail-designs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DetailDesign])],
  controllers: [DetailDesignsController],
  providers: [DetailDesignsService],
  exports: [DetailDesignsService],
})
export class DetailDesignsModule {}
