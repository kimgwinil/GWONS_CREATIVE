/**
 * GWONS_CREATIVE — IntegratedPlan Entity
 * 기획팀: 통합 기획서 (Phase 1 합류 결과물)
 * 시나리오 + 콘셉트 기획서 + 3D 무드보드 + 2D 레이아웃 통합
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum IntegratedPlanStatus {
  ASSEMBLING    = 'assembling',     // 취합 중 (각 팀 산출물 수집)
  IN_REVIEW     = 'in_review',      // 내부 검토
  CLIENT_REVIEW = 'client_review',  // 클라이언트 검토
  APPROVED      = 'approved',       // 클라이언트 승인 완료 → Phase 2 진입 가능
  REJECTED      = 'rejected',       // 반려
}

/** 팀별 산출물 참조 및 완료 상태 */
export interface TeamDeliverable {
  teamName: string;                        // '기획팀' | '3D디자인팀' | '2D디자인팀'
  deliverableType: string;                 // 'scenario' | 'concept_plan' | 'moodboard' | 'layout_sketch'
  deliverableId: string;                   // 참조 ID
  deliverableTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

@Entity('integrated_plans')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class IntegratedPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string;    // 핵심 요약 (클라이언트 보고용)

  @Column({ type: 'varchar', length: 50, default: IntegratedPlanStatus.ASSEMBLING })
  status: IntegratedPlanStatus;

  /** 팀별 산출물 목록 (체크리스트) */
  @Column({ type: 'jsonb', default: [] })
  deliverables: TeamDeliverable[];

  /** 연결 ID 목록 */
  @Column({ type: 'uuid', nullable: true })
  conceptPlanId: string;

  @Column({ type: 'uuid', nullable: true })
  scenarioId: string;

  @Column({ type: 'uuid', nullable: true })
  moodboardId: string;

  @Column({ type: 'uuid', nullable: true })
  layoutSketchId: string;

  /** 버전 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 클라이언트 검토 의견 */
  @Column({ type: 'text', nullable: true })
  clientFeedback: string;

  /** 내부 검토 의견 */
  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  /** 게이트 #1 컨펌 정보 */
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
