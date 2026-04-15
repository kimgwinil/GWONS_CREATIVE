import { InspectionStatus, InspectionCategory, ChecklistItem, DefectRecord } from '../entities/quality-inspection.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateQualityInspectionDto {
  projectId: string;
  title: string;
  description?: string;
  category: InspectionCategory;
  checklistItems?: ChecklistItem[];
  scheduledAt?: Date;
  inspector?: string;
  targetZone?: string;
  constructionPlanId?: string;
  contentInstallationId?: string;
}

export class UpdateQualityInspectionDto {
  title?: string;
  description?: string;
  checklistItems?: ChecklistItem[];
  defects?: DefectRecord[];
  scheduledAt?: Date;
  inspector?: string;
  targetZone?: string;
  overallComment?: string;
}

export class CompleteInspectionDto {
  inspector: string;
  finalResult: 'pass' | 'fail' | 'conditional_pass';
  overallComment?: string;
}

export class ResolveDefectDto {
  resolution: string;
  resolvedBy?: string;
}

export class ListQualityInspectionsDto extends PaginationInputDto {
  projectId?: string;
  status?: InspectionStatus;
  category?: InspectionCategory;
}
