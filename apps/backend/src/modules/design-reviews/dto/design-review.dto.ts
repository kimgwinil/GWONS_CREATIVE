import { DesignReviewStatus, Phase2Deliverable, DesignIssue } from '../entities/design-review.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateDesignReviewDto {
  projectId: string;
  title: string;
  executiveSummary?: string;
  basicDesignId?: string;
  detailDesignId?: string;
  renderAssetId?: string;
  cadDrawingId?: string;
  marketResearchId?: string;
  deliverables?: Phase2Deliverable[];
  internalNotes?: string;
}

export class UpdateDesignReviewDto {
  title?: string;
  executiveSummary?: string;
  deliverables?: Phase2Deliverable[];
  designIssues?: DesignIssue[];
  internalNotes?: string;
  clientFeedback?: string;
  basicDesignId?: string;
  detailDesignId?: string;
  renderAssetId?: string;
  cadDrawingId?: string;
  marketResearchId?: string;
}

export class ApproveDesignReviewDto {
  approvedBy: string;
  clientFeedback?: string;
}

export class ListDesignReviewsDto extends PaginationInputDto {
  projectId?: string;
  status?: DesignReviewStatus;
}
