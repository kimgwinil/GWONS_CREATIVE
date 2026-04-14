import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConceptPlan } from './entities/concept-plan.entity';
import { ConceptPlansService } from './concept-plans.service';
import { ConceptPlansController } from './concept-plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConceptPlan])],
  controllers: [ConceptPlansController],
  providers: [ConceptPlansService],
  exports: [ConceptPlansService],
})
export class ConceptPlansModule {}
