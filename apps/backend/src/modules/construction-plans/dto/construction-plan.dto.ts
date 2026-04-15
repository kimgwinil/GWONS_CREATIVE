/**
 * GWONS_CREATIVE — ConstructionPlan DTOs
 */
import { ConstructionStatus, ConstructionTask, StructureItem } from '../entities/construction-plan.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateConstructionPlanDto {
  projectId: string;
  title: string;
  description?: string;
  tasks?: ConstructionTask[];
  structureItems?: StructureItem[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  siteManager?: string;
  procurementListId?: string;
  notes?: string;
}

export class UpdateConstructionPlanDto {
  title?: string;
  description?: string;
  tasks?: ConstructionTask[];
  structureItems?: StructureItem[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  siteManager?: string;
  notes?: string;
}

export class UpdateTaskProgressDto {
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  progressRate?: number;
  actualStart?: string;
  actualEnd?: string;
  delayDays?: number;
  delayReason?: string;
  notes?: string;
}

export class InspectConstructionDto {
  inspectedBy: string;
  result: 'pass' | 'fail' | 'conditional_pass';
  findings?: string;
}

export class ListConstructionPlansDto extends PaginationInputDto {
  projectId?: string;
  status?: ConstructionStatus;
}
