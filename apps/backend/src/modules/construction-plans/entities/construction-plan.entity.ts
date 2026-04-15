/**
 * GWONS_CREATIVE — ConstructionPlan Entity
 * 시공팀: 공간 시공 + 구조물 설치 계획 관리
 * Phase 4 병렬 — 시공 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ConstructionStatus {
  PLANNING       = 'planning',        // 시공 계획 수립 중
  APPROVED       = 'approved',        // 시공 계획 승인
  IN_PROGRESS    = 'in_progress',     // 시공 진행 중
  SUSPENDED      = 'suspended',       // 시공 중단 (이슈)
  COMPLETED      = 'completed',       // 시공 완료
  INSPECTED      = 'inspected',       // 준공 검수 완료
}

export enum ConstructionZoneType {
  MAIN_HALL      = 'main_hall',       // 메인 전시홀
  ENTRANCE       = 'entrance',        // 입구/로비
  EXPERIENCE     = 'experience',      // 체험존
  UTILITY        = 'utility',         // 유틸리티/장비실
  OUTDOOR        = 'outdoor',         // 외부 공간
}

/** 시공 작업 항목 */
export interface ConstructionTask {
  taskId: string;
  taskName: string;
  zone: string;
  zoneType: ConstructionZoneType;
  contractor: string;            // 시공 업체
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  progressRate: number;          // 0~100%
  delayDays?: number;
  delayReason?: string;
  notes?: string;
}

/** 구조물 설치 항목 */
export interface StructureItem {
  itemId: string;
  itemName: string;
  zone: string;
  quantity: number;
  unit: string;
  material?: string;
  installedBy: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'installed' | 'failed';
  defectNote?: string;
  purchaseOrderRef?: string;     // H/W 발주서 참조
}

/** 안전 점검 기록 */
export interface SafetyCheckRecord {
  checkId: string;
  checkDate: string;
  checkedBy: string;
  zone: string;
  result: 'pass' | 'fail' | 'warning';
  findings?: string;
  correctionRequired?: string;
  correctedAt?: string;
}

@Entity('construction_plans')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class ConstructionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ConstructionStatus.PLANNING })
  status: ConstructionStatus;

  /** 시공 작업 목록 */
  @Column({ type: 'jsonb', default: [] })
  tasks: ConstructionTask[];

  /** 구조물 설치 목록 */
  @Column({ type: 'jsonb', default: [] })
  structureItems: StructureItem[];

  /** 안전 점검 기록 */
  @Column({ type: 'jsonb', default: [] })
  safetyChecks: SafetyCheckRecord[];

  /** 전체 진행률 (%) */
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  overallProgressRate: number;

  /** 총 작업 수 */
  @Column({ type: 'int', default: 0 })
  totalTasks: number;

  /** 완료된 작업 수 */
  @Column({ type: 'int', default: 0 })
  completedTasks: number;

  /** 지연된 작업 수 */
  @Column({ type: 'int', default: 0 })
  delayedTasks: number;

  /** 시공 시작일 */
  @Column({ type: 'date', nullable: true })
  plannedStartDate: Date;

  /** 시공 완료 목표일 */
  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  /** 실제 완료일 */
  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  /** 시공 책임자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  siteManager: string;

  /** 준공 검수자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  inspectedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  inspectedAt: Date;

  /** 참조 조달 목록 ID */
  @Column({ type: 'uuid', nullable: true })
  procurementListId: string;

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
