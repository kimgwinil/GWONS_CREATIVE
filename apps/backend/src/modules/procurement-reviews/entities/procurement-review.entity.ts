/**
 * GWONS_CREATIVE — ProcurementReview Entity
 * 기획팀: Phase 3 조달 통합 검토서 — 컨펌 게이트 #3
 * 발주서(H/W) + S/W발주서 + 납품일정표 통합 승인
 * 통과 시 Phase 4(구현) 착수
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ProcurementReviewStatus {
  COLLECTING    = 'collecting',      // 조달 결과 수집 중
  IN_REVIEW     = 'in_review',       // 기획팀 통합 검토
  BUDGET_CHECK  = 'budget_check',    // 예산 최종 확인
  CLIENT_REVIEW = 'client_review',   // 클라이언트 제출
  APPROVED      = 'approved',        // 컨펌 게이트 #3 통과 → Phase 4 착수
  REJECTED      = 'rejected',
}

/** Phase 3 산출물 체크리스트 */
export interface Phase3Deliverable {
  teamName: string;
  deliverableType: 'procurement_list' | 'purchase_order' | 'software_order' | 'delivery_schedule';
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  amount?: number;
  completedAt?: string;
  notes?: string;
}

/** 예산 vs 실적 비교 */
export interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  varianceRate: number;   // %
  withinBudget: boolean;
}

/** 조달 이슈 */
export interface ProcurementIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'delay' | 'budget' | 'spec' | 'vendor' | 'other';
  description: string;
  impact: string;
  resolution?: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
}

@Entity('procurement_reviews')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class ProcurementReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string;

  @Column({ type: 'varchar', length: 50, default: ProcurementReviewStatus.COLLECTING })
  status: ProcurementReviewStatus;

  /** Phase 3 산출물 체크리스트 */
  @Column({ type: 'jsonb', default: [] })
  deliverables: Phase3Deliverable[];

  /** 예산 대비 실적 비교 */
  @Column({ type: 'jsonb', default: [] })
  budgetComparisons: BudgetComparison[];

  /** 조달 이슈 */
  @Column({ type: 'jsonb', default: [] })
  procurementIssues: ProcurementIssue[];

  /** 총 발주 금액 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalProcurementAmount: number;

  /** 예산 대비 초과/절감 금액 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetVariance: number;

  /** 예산 범위 내 여부 */
  @Column({ type: 'boolean', nullable: true })
  isWithinBudget: boolean;

  /** 참조 문서 */
  @Column({ type: 'uuid', nullable: true }) procurementListId: string;
  @Column({ type: 'uuid', nullable: true }) deliveryScheduleId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'text', nullable: true })
  clientFeedback: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

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
