import { DetailDesignStatus, FinishSpec, EquipmentSpec, ContentSpec } from '../entities/detail-design.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateDetailDesignDto {
  projectId: string;
  title: string;
  description?: string;
  basicDesignId?: string;
  finishSpecs?: FinishSpec[];
  equipmentSpecs?: EquipmentSpec[];
  contentSpecs?: ContentSpec[];
  totalPowerKw?: number;
  estimatedConstructionCost?: number;
}

export class UpdateDetailDesignDto {
  title?: string;
  description?: string;
  finishSpecs?: FinishSpec[];
  equipmentSpecs?: EquipmentSpec[];
  contentSpecs?: ContentSpec[];
  totalPowerKw?: number;
  estimatedConstructionCost?: number;
}

export class ApproveDetailDesignDto {
  approvedBy: string;
}

export class ListDetailDesignsDto extends PaginationInputDto {
  projectId?: string;
  status?: DetailDesignStatus;
}
