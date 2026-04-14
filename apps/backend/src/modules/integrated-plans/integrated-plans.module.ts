import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegratedPlan } from './entities/integrated-plan.entity';
import { IntegratedPlansService } from './integrated-plans.service';
import { IntegratedPlansController } from './integrated-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IntegratedPlan])],
  controllers: [IntegratedPlansController],
  providers: [IntegratedPlansService],
  exports: [IntegratedPlansService],
})
export class IntegratedPlansModule {}
