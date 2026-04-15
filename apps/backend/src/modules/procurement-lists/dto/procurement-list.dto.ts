/**
 * GWONS_CREATIVE — ProcurementList DTOs
 */
import { ProcurementListStatus, ProcurementLineItem, BudgetSummary } from '../entities/procurement-list.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateProcurementListDto {
  projectId: string;
  title: string;
  description?: string;
  lineItems?: ProcurementLineItem[];
  totalBudget?: number;
  contingencyRate?: number;
  designReviewId?: string;
}

export class UpdateProcurementListDto {
  title?: string;
  description?: string;
  lineItems?: ProcurementLineItem[];
  totalBudget?: number;
  contingencyRate?: number;
  approvalNotes?: string;
}

export class ApproveProcurementListDto {
  approvedBy: string;
  approvalNotes?: string;
}

export class ListProcurementListsDto extends PaginationInputDto {
  projectId?: string;
  status?: ProcurementListStatus;
}
