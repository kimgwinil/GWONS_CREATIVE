/**
 * GWONS_CREATIVE — ContentUpdate Entity
 * 3D/2D팀: 추가 콘텐츠 업데이트 지원
 * Phase 5 운영 — 3D/2D 디자인팀 트랙
 * 운영 중 콘텐츠 교체·추가·수정 요청 처리
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ContentUpdateStatus {
  REQUESTED   = 'requested',    // 업데이트 요청
  IN_PROGRESS = 'in_progress',  // 작업 중
  REVIEW      = 'review',       // 검토 중
  APPROVED    = 'approved',     // 승인
  DEPLOYED    = 'deployed',     // 현장 반영 완료
  REJECTED    = 'rejected',     // 반려
}

export enum UpdateType {
  CONTENT_REPLACE  = 'content_replace',  // 콘텐츠 교체
  CONTENT_ADD      = 'content_add',      // 콘텐츠 추가
  VISUAL_MODIFY    = 'visual_modify',    // 시각 요소 수정
  LAYOUT_CHANGE    = 'layout_change',    // 레이아웃 변경
  SEASONAL_UPDATE  = 'seasonal_update',  // 시즌 업데이트
  BUGFIX           = 'bugfix',           // 오류 수정
}

export enum UpdatePriority {
  URGENT  = 'urgent',   // 긴급 (당일 처리)
  HIGH    = 'high',     // 높음 (3일 이내)
  NORMAL  = 'normal',   // 보통 (1주 이내)
  LOW     = 'low',      // 낮음 (일정 협의)
}

/** 업데이트 대상 항목 */
export interface UpdateTargetItem {
  itemId: string;
  targetName: string;       // 대상 콘텐츠/장치명
  targetZone: string;       // 위치 구역
  currentVersion: string;   // 현재 버전
  newVersion: string;       // 업데이트 버전
  fileUrl?: string;         // 새 파일 URL
  thumbnailUrl?: string;
  changeDescription: string;
  status: 'pending' | 'completed' | 'failed';
}

/** 리뷰 피드백 */
export interface ReviewFeedback {
  reviewedBy: string;
  reviewedAt: string;
  result: 'approved' | 'rejected' | 'revision_needed';
  comment: string;
}

@Entity('content_updates')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'updateType', 'createdAt'])
export class ContentUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ContentUpdateStatus.REQUESTED })
  status: ContentUpdateStatus;

  @Column({ type: 'varchar', length: 50 })
  updateType: UpdateType;

  @Column({ type: 'varchar', length: 50, default: UpdatePriority.NORMAL })
  priority: UpdatePriority;

  /** 업데이트 대상 항목 */
  @Column({ type: 'jsonb', default: [] })
  targetItems: UpdateTargetItem[];

  /** 리뷰 이력 */
  @Column({ type: 'jsonb', default: [] })
  reviewHistory: ReviewFeedback[];

  /** 집계 */
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  completedItems: number;

  /** 요청자 / 담당자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  requestedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  /** 배포 정보 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  deployedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  deployedAt: Date;

  /** 희망 반영일 */
  @Column({ type: 'date', nullable: true })
  requestedDeadline: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

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
