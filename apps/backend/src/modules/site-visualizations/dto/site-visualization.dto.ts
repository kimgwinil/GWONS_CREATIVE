import { SiteVisualizationStatus, VisualizationType, ComparisonData } from '../entities/site-visualization.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateSiteVisualizationDto {
  projectId: string;
  title: string;
  description?: string;
  vizType: VisualizationType;
  targetZone?: string;
  constructionPlanId?: string;
  renderAssetId?: string;
  createdBy?: string;
  sourceFileUrl?: string;
}

export class UpdateSiteVisualizationDto {
  title?: string;
  description?: string;
  sourceFileUrl?: string;
  outputFileUrl?: string;
  thumbnailUrl?: string;
  comparisonData?: ComparisonData[];
  targetZone?: string;
  reviewNotes?: string;
}

export class RequestRevisionDto {
  requestedBy: string;
  reason: string;
  description: string;
}

export class CompleteRevisionDto {
  result: string;
  outputFileUrl?: string;
}

export class ApproveVisualizationDto {
  approvedBy: string;
  notes?: string;
}

export class ListSiteVisualizationsDto extends PaginationInputDto {
  projectId?: string;
  status?: SiteVisualizationStatus;
  vizType?: VisualizationType;
}
