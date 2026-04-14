import { ProjectPhase, ProjectStatus } from '../entities/project.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateProjectDto {
  name: string;
  description?: string;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export class UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  clientName?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
}

export class ConfirmGateDto {
  confirmedBy: string;
}

export class ListProjectsDto extends PaginationInputDto {
  status?: ProjectStatus;
  phase?: ProjectPhase;
}
