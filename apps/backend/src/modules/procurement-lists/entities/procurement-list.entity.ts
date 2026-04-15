/**
 * GWONS_CREATIVE — ProcurementList Entity
 * 기획팀 + 조달팀: Phase 2 시장조사 결과를 바탕으로 최종 조달 목록 확정
 * Phase 3 착수 트리거 문서 (컨펌 게이트 #2 통과 후 생성)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ProcurementListStatus {
  DRAFTING   = 'drafting',    // 목록 작성 중
  IN_REVIEW  = 'in_review',   // 기획팀 검토 중
  APPROVED   = 'approved',    // 최종 승인 → H/W·S/W 병렬 발주 착수
  LOCKED     = 'locked',      // 발주 시작 후 잠금 (변경 불가)
}

/** 조달 목록 항목 */
export interface ProcurementLineItem {
  lineNo: number;
  itemName: string;
  category: 'hardware' | 'software' | 'content' | 'service' | 'material';
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  currency: 'KRW' | 'USD' | 'EUR';
  vendorName?: string;
  isCustom: boolean;
  customSpec?: string;
  marketResearchId?: string;   // Phase 2 시장조사 참조
  priority: 'critical' | 'high' | 'medium' | 'low';
  leadTimeDays: number;
  notes?: string;
}

/** 예산 요약 */
export interface BudgetSummary {
  hardware: number;
  software: number;
  content: number;
  service: number;
  material: number;
  contingency: number;   // 예비비 (%)
  totalEstimated: number;
}

@Entity('procurement_lists')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class ProcurementList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ProcurementListStatus.DRAFTING })
  status: ProcurementListStatus;

  /** 조달 항목 목록 */
  @Column({ type: 'jsonb', default: [] })
  lineItems: ProcurementLineItem[];

  /** 카테고리별 예산 요약 */
  @Column({ type: 'jsonb', nullable: true })
  budgetSummary: BudgetSummary;

  /** 총 예산 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalBudget: number;

  /** 예비비 비율 (%) */
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  contingencyRate: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  /** 기준 설계 검토서 (Phase 2 gate #2 결과 참조) */
  @Column({ type: 'uuid', nullable: true })
  designReviewId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

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
