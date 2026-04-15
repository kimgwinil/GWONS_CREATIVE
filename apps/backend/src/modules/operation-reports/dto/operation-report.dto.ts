import { ReportStatus, ReportPeriod, OperationMetric, Phase5DeliverableSummary, OperationIssue, NextPeriodPlan } from '../entities/operation-report.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateOperationReportDto {
  projectId: string;
  title: string;
  executiveSummary?: string;
  reportPeriod: ReportPeriod;
  periodStart?: Date;
  periodEnd?: Date;
  metrics?: OperationMetric[];
  deliverableSummaries?: Phase5DeliverableSummary[];
  issues?: OperationIssue[];
  nextPeriodPlans?: NextPeriodPlan[];
  author?: string;
  internalNotes?: string;
}

export class UpdateOperationReportDto {
  title?: string;
  executiveSummary?: string;
  metrics?: OperationMetric[];
  deliverableSummaries?: Phase5DeliverableSummary[];
  issues?: OperationIssue[];
  nextPeriodPlans?: NextPeriodPlan[];
  author?: string;
  internalNotes?: string;
}

export class PublishOperationReportDto {
  publishedBy: string;
  notes?: string;
}

export class AcknowledgeOperationReportDto {
  acknowledgedBy: string;
  clientFeedback?: string;
}

export class ListOperationReportsDto extends PaginationInputDto {
  projectId?: string;
  status?: ReportStatus;
  reportPeriod?: ReportPeriod;
}
