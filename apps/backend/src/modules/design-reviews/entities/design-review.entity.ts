/**
 * GWONS_CREATIVE — DesignReview Entity
 * 기획팀: 설계 통합 검토서 (Phase 2 합류 + 컨펌 게이트 #2)
 * 기본설계서 + 상세설계서 + 3D렌더 + CAD도면 + 시장조사 통합 승인
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum DesignReviewStatus {
  COLLECTING    = 'collecting',      // 산출물 수집 중
  IN_REVIEW     = 'in_review',       // 통합 검토 중
  CLIENT_REVIEW = 'client_review',   // 클라이언트 검토
  APPROVED      = 'approved',        // 컨펌 게이트 #2 통과
  REJECTED      = 'rejected',
}

/** Phase 2 팀별 산출물 체크리스트 */
export interface Phase2Deliverable {
  teamName: string;
  deliverableType: string;
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  reviewComment?: string;
}

/** 설계 이슈 목록 */
export interface DesignIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  assignedTo: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
}

@Entity('design_reviews')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class DesignReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string;

  @Column({ type: 'varchar', length: 50, default: DesignReviewStatus.COLLECTING })
  status: DesignReviewStatus;

  /** Phase 2 팀별 산출물 체크리스트 */
  @Column({ type: 'jsonb', default: [] })
  deliverables: Phase2Deliverable[];

  /** 설계 이슈 목록 */
  @Column({ type: 'jsonb', default: [] })
  designIssues: DesignIssue[];

  /** 참조 산출물 ID */
  @Column({ type: 'uuid', nullable: true }) basicDesignId: string;
  @Column({ type: 'uuid', nullable: true }) detailDesignId: string;
  @Column({ type: 'uuid', nullable: true }) renderAssetId: string;
  @Column({ type: 'uuid', nullable: true }) cadDrawingId: string;
  @Column({ type: 'uuid', nullable: true }) marketResearchId: string;

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
