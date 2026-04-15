import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConstructionPlan } from './entities/construction-plan.entity';
import { ConstructionPlansService } from './construction-plans.service';
import { ConstructionPlansController } from './construction-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConstructionPlan])],
  controllers: [ConstructionPlansController],
  providers: [ConstructionPlansService],
  exports: [ConstructionPlansService],
})
export class ConstructionPlansModule {}
