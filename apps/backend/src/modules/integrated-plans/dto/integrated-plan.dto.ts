import { IntegratedPlanStatus, TeamDeliverable } from '../entities/integrated-plan.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateIntegratedPlanDto {
  projectId: string;
  title: string;
  executiveSummary?: string;
  conceptPlanId?: string;
  scenarioId?: string;
  moodboardId?: string;
  layoutSketchId?: string;
  deliverables?: TeamDeliverable[];
  internalNotes?: string;
}

export class UpdateIntegratedPlanDto {
  title?: string;
  executiveSummary?: string;
  conceptPlanId?: string;
  scenarioId?: string;
  moodboardId?: string;
  layoutSketchId?: string;
  deliverables?: TeamDeliverable[];
  internalNotes?: string;
  clientFeedback?: string;
}

export class ApproveIntegratedPlanDto {
  approvedBy: string;
  clientFeedback?: string;
}

export class ListIntegratedPlansDto extends PaginationInputDto {
  projectId?: string;
  status?: IntegratedPlanStatus;
}
