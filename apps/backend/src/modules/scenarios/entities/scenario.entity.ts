/**
 * GWONS_CREATIVE — Scenario Entity
 * 기획팀: 전시 체험 시나리오 (시퀀스·동선·체험요소 정의)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ScenarioStatus {
  DRAFT     = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED  = 'approved',
  ARCHIVED  = 'archived',
}

export enum ScenarioType {
  MAIN       = 'main',       // 메인 관람 시나리오
  EXPERIENCE = 'experience', // 체험 활동 시나리오
  EMERGENCY  = 'emergency',  // 비상·안전 시나리오
  VIP        = 'vip',        // VIP 관람 시나리오
}

/** 시나리오 단계 (시퀀스 아이템) */
export interface ScenarioStep {
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  location: string;
  interactionType: 'passive' | 'active' | 'mixed';
  requiredEquipment?: string[];
  notes?: string;
}

@Entity('scenarios')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ScenarioType.MAIN })
  type: ScenarioType;

  @Column({ type: 'varchar', length: 50, default: ScenarioStatus.DRAFT })
  status: ScenarioStatus;

  /** 시나리오 단계 목록 (순서·시간·장소·상호작용 유형 포함) */
  @Column({ type: 'jsonb', default: [] })
  steps: ScenarioStep[];

  /** 전체 예상 소요 시간 (분) */
  @Column({ type: 'int', nullable: true })
  totalDurationMinutes: number;

  /** 대상 관람객 유형 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  targetAudience: string;

  /** 동시 수용 인원 */
  @Column({ type: 'int', nullable: true })
  maxCapacity: number;

  /** 검토 의견 */
  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  /** 승인자 */
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
