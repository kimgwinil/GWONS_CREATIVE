import { ScenarioType, ScenarioStatus, ScenarioStep } from '../entities/scenario.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateScenarioDto {
  projectId: string;
  title: string;
  description?: string;
  type?: ScenarioType;
  steps?: ScenarioStep[];
  totalDurationMinutes?: number;
  targetAudience?: string;
  maxCapacity?: number;
}

export class UpdateScenarioDto {
  title?: string;
  description?: string;
  type?: ScenarioType;
  status?: ScenarioStatus;
  steps?: ScenarioStep[];
  totalDurationMinutes?: number;
  targetAudience?: string;
  maxCapacity?: number;
  reviewNotes?: string;
}

export class ApproveScenarioDto {
  approvedBy: string;
  reviewNotes?: string;
}

export class ListScenariosDto extends PaginationInputDto {
  projectId?: string;
  type?: ScenarioType;
  status?: ScenarioStatus;
}
