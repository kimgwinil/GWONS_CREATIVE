import { ConceptPlanStatus, ExhibitionTheme, CirculationZone, ExperienceElement } from '../entities/concept-plan.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateConceptPlanDto {
  projectId: string;
  title: string;
  theme?: ExhibitionTheme;
  conceptStatement?: string;
  objectives?: string;
  targetAudience?: string;
  exhibitionDays?: number;
  expectedDailyVisitors?: number;
  totalAreaSqm?: number;
  circulationZones?: CirculationZone[];
  experienceElements?: ExperienceElement[];
  linkedScenarioIds?: string[];
}

export class UpdateConceptPlanDto {
  title?: string;
  theme?: ExhibitionTheme;
  conceptStatement?: string;
  objectives?: string;
  targetAudience?: string;
  exhibitionDays?: number;
  expectedDailyVisitors?: number;
  totalAreaSqm?: number;
  circulationZones?: CirculationZone[];
  experienceElements?: ExperienceElement[];
  linkedScenarioIds?: string[];
  reviewNotes?: string;
}

export class ApproveConceptPlanDto {
  approvedBy: string;
  reviewNotes?: string;
}

export class ListConceptPlansDto extends PaginationInputDto {
  projectId?: string;
  theme?: ExhibitionTheme;
  status?: ConceptPlanStatus;
}
