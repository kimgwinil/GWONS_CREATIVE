import { BasicDesignStatus, SpaceProgram, SystemRequirement } from '../entities/basic-design.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateBasicDesignDto {
  projectId: string;
  title: string;
  description?: string;
  designCriteria?: string[];
  spacePrograms?: SpaceProgram[];
  systemRequirements?: SystemRequirement[];
  totalFloorAreaSqm?: number;
  totalFloors?: number;
  integratedPlanId?: string;
}

export class UpdateBasicDesignDto {
  title?: string;
  description?: string;
  designCriteria?: string[];
  spacePrograms?: SpaceProgram[];
  systemRequirements?: SystemRequirement[];
  totalFloorAreaSqm?: number;
  totalFloors?: number;
}

export class ListBasicDesignsDto extends PaginationInputDto {
  projectId?: string;
  status?: BasicDesignStatus;
}
