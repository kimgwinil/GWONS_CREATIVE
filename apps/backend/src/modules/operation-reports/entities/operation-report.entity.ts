/**
 * GWONS_CREATIVE — OperationReport Entity
 * 기획팀: 종합 운영 현황 리포트 (Phase 5 합류)
 * 운영 가이드 + 유지보수 계약 + 콘텐츠 업데이트 현황을 종합하여
 * 정기/특별 운영 리포트 생성 및 클라이언트 보고
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ReportStatus {
  DRAFTING      = 'drafting',       // 작성 중
  IN_REVIEW     = 'in_review',      // 검토 중
  PUBLISHED     = 'published',      // 발행 완료
  ACKNOWLEDGED  = 'acknowledged',   // 클라이언트 확인
}

export enum ReportPeriod {
  WEEKLY    = 'weekly',
  MONTHLY   = 'monthly',
  QUARTERLY = 'quarterly',
  SPECIAL   = 'special',   // 특별 보고
}

/** 운영 지표 항목 */
export interface OperationMetric {
  metricName: string;
  category: 'visitor' | 'system' | 'content' | 'maintenance' | 'incident';
  value: number;
  unit: string;
  target?: number;
  achievementRate?: number;   // 달성률 (%)
  trend?: 'up' | 'down' | 'stable';
  note?: string;
}

/** Phase 5 산출물 현황 */
export interface Phase5DeliverableSummary {
  deliverableType: 'operation_guide' | 'maintenance_contract' | 'content_update';
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  issueCount: number;
  highlights?: string;
}

/** 이슈/리스크 */
export interface OperationIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  status: 'open' | 'resolved';
  resolution?: string;
  reportedAt: string;
}

/** 다음 기간 계획 */
export interface NextPeriodPlan {
  planItem: string;
  responsibleTeam: string;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
}

@Entity('operation_reports')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'reportPeriod', 'createdAt'])
export class OperationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string;

  @Column({ type: 'varchar', length: 50, default: ReportStatus.DRAFTING })
  status: ReportStatus;

  @Column({ type: 'varchar', length: 50 })
  reportPeriod: ReportPeriod;

  /** 보고 기간 */
  @Column({ type: 'date', nullable: true })
  periodStart: Date;

  @Column({ type: 'date', nullable: true })
  periodEnd: Date;

  /** 운영 지표 */
  @Column({ type: 'jsonb', default: [] })
  metrics: OperationMetric[];

  /** Phase 5 산출물 현황 요약 */
  @Column({ type: 'jsonb', default: [] })
  deliverableSummaries: Phase5DeliverableSummary[];

  /** 이슈/리스크 */
  @Column({ type: 'jsonb', default: [] })
  issues: OperationIssue[];

  /** 다음 기간 계획 */
  @Column({ type: 'jsonb', default: [] })
  nextPeriodPlans: NextPeriodPlan[];

  @Column({ type: 'int', default: 1 })
  version: number;

  /** 작성자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string;

  /** 발행 정보 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  publishedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date;

  /** 클라이언트 확인 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'text', nullable: true })
  clientFeedback: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
