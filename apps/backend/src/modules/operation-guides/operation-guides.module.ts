import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationGuide } from './entities/operation-guide.entity';
import { OperationGuidesController } from './operation-guides.controller';
import { OperationGuidesService } from './operation-guides.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperationGuide])],
  controllers: [OperationGuidesController],
  providers: [OperationGuidesService],
  exports: [OperationGuidesService],
})
export class OperationGuidesModule {}
