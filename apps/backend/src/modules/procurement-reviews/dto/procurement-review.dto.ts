/**
 * GWONS_CREATIVE — ProcurementReview DTOs
 */
import { ProcurementReviewStatus, Phase3Deliverable, BudgetComparison, ProcurementIssue } from '../entities/procurement-review.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateProcurementReviewDto {
  projectId: string;
  title: string;
  executiveSummary?: string;
  procurementListId?: string;
  deliveryScheduleId?: string;
  totalProcurementAmount?: number;
  budgetVariance?: number;
}

export class UpdateProcurementReviewDto {
  title?: string;
  executiveSummary?: string;
  deliverables?: Phase3Deliverable[];
  budgetComparisons?: BudgetComparison[];
  procurementIssues?: ProcurementIssue[];
  totalProcurementAmount?: number;
  budgetVariance?: number;
  isWithinBudget?: boolean;
  internalNotes?: string;
}

export class ApproveProcurementReviewDto {
  approvedBy: string;
  clientFeedback?: string;
}

export class ListProcurementReviewsDto extends PaginationInputDto {
  projectId?: string;
  status?: ProcurementReviewStatus;
}
