/**
 * GWONS_CREATIVE — SiteVisualization Entity
 * 3D 디자인팀: 구현 단계 현장 시각화 지원·수정
 * Phase 4 병렬 — 3D 시각화 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum SiteVisualizationStatus {
  DRAFT        = 'draft',         // 작업 중
  IN_REVIEW    = 'in_review',     // 검토 요청
  REVISION     = 'revision',      // 현장 반영 수정 중
  APPROVED     = 'approved',      // 현장 반영 완료 승인
  FINAL        = 'final',         // 최종 확정
}

export enum VisualizationType {
  PROGRESS_VIZ   = 'progress_viz',    // 시공 진행 현황 시각화
  AS_BUILT       = 'as_built',        // 준공 후 실측 3D
  COMPARISON     = 'comparison',      // 설계 vs 실제 비교
  WALKTHROUGH    = 'walkthrough',     // 현장 워크스루 영상
  POINT_CLOUD    = 'point_cloud',     // 포인트 클라우드
}

/** 현장 수정 이력 */
export interface RevisionRecord {
  revNo: number;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  description: string;
  completedAt?: string;
  result?: string;
}

/** 현장 비교 데이터 */
export interface ComparisonData {
  zone: string;
  designValue: string;
  actualValue: string;
  deviation: string;
  deviationPct?: number;
  isWithinTolerance: boolean;
  notes?: string;
}

@Entity('site_visualizations')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'vizType', 'createdAt'])
export class SiteVisualization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  vizType: VisualizationType;

  @Column({ type: 'varchar', length: 50, default: SiteVisualizationStatus.DRAFT })
  status: SiteVisualizationStatus;

  /** 원본 파일 URL (3D 파일, 영상 등) */
  @Column({ type: 'text', nullable: true })
  sourceFileUrl: string;

  /** 렌더링된 결과 URL */
  @Column({ type: 'text', nullable: true })
  outputFileUrl: string;

  /** 썸네일 */
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  /** 현장 수정 이력 */
  @Column({ type: 'jsonb', default: [] })
  revisionHistory: RevisionRecord[];

  /** 설계 vs 실제 비교 데이터 */
  @Column({ type: 'jsonb', default: [] })
  comparisonData: ComparisonData[];

  /** 현재 수정 번호 */
  @Column({ type: 'int', default: 0 })
  currentRevision: number;

  /** 대상 구역 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  targetZone: string;

  /** 연계 시공 계획 ID */
  @Column({ type: 'uuid', nullable: true })
  constructionPlanId: string;

  /** 연계 Phase 2 렌더 에셋 ID */
  @Column({ type: 'uuid', nullable: true })
  renderAssetId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

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
