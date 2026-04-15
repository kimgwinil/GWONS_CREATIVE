import { OperationGuideStatus, GuideCategory, OperationStep, EmergencyContact, OperatingSchedule } from '../entities/operation-guide.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateOperationGuideDto {
  projectId: string;
  title: string;
  description?: string;
  category: GuideCategory;
  steps?: OperationStep[];
  emergencyContacts?: EmergencyContact[];
  operatingSchedule?: OperatingSchedule[];
  documentUrl?: string;
  author?: string;
  validUntil?: Date;
  notes?: string;
}

export class UpdateOperationGuideDto {
  title?: string;
  description?: string;
  steps?: OperationStep[];
  emergencyContacts?: EmergencyContact[];
  operatingSchedule?: OperatingSchedule[];
  documentUrl?: string;
  author?: string;
  validUntil?: Date;
  notes?: string;
}

export class ApproveOperationGuideDto {
  approvedBy: string;
  notes?: string;
}

export class DeliverOperationGuideDto {
  deliveredTo: string;
  notes?: string;
}

export class ListOperationGuidesDto extends PaginationInputDto {
  projectId?: string;
  status?: OperationGuideStatus;
  category?: GuideCategory;
}
