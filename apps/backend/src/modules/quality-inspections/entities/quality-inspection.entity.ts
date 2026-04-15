/**
 * GWONS_CREATIVE — QualityInspection Entity
 * 기획팀: 품질 관리 + 현장 일정 관리
 * Phase 4 병렬 — 기획팀 품질 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum InspectionStatus {
  SCHEDULED    = 'scheduled',      // 점검 예정
  IN_PROGRESS  = 'in_progress',    // 점검 진행 중
  COMPLETED    = 'completed',      // 점검 완료
  FAILED       = 'failed',         // 불합격
  RE_INSPECTED = 're_inspected',   // 재검수 완료
}

export enum InspectionCategory {
  CONSTRUCTION = 'construction',   // 시공 품질
  CONTENT      = 'content',        // 콘텐츠 품질
  SYSTEM       = 'system',         // 시스템 통합
  SAFETY       = 'safety',         // 안전 기준
  DESIGN       = 'design',         // 설계 일치도
  EXPERIENCE   = 'experience',     // 체험 품질
}

/** 체크리스트 항목 */
export interface ChecklistItem {
  itemId: string;
  category: InspectionCategory;
  zone: string;
  checkPoint: string;
  standard: string;               // 검수 기준
  result: 'pass' | 'fail' | 'na' | 'pending';
  actualValue?: string;
  inspectorNote?: string;
  photoUrl?: string;
  isDefect: boolean;
  defectSeverity?: 'critical' | 'major' | 'minor';
}

/** 불합격 항목 (결함) */
export interface DefectRecord {
  defectId: string;
  checklistItemId: string;
  severity: 'critical' | 'major' | 'minor';
  category: InspectionCategory;
  zone: string;
  description: string;
  assignedTo: string;             // 조치 팀
  dueDate: string;
  status: 'open' | 'in_progress' | 'resolved' | 'waived';
  resolution?: string;
  resolvedAt?: string;
}

@Entity('quality_inspections')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'category', 'createdAt'])
export class QualityInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: InspectionStatus.SCHEDULED })
  status: InspectionStatus;

  @Column({ type: 'varchar', length: 50 })
  category: InspectionCategory;

  /** 체크리스트 항목 */
  @Column({ type: 'jsonb', default: [] })
  checklistItems: ChecklistItem[];

  /** 결함 목록 */
  @Column({ type: 'jsonb', default: [] })
  defects: DefectRecord[];

  /** 전체 체크 항목 수 */
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  /** 합격 항목 수 */
  @Column({ type: 'int', default: 0 })
  passedItems: number;

  /** 불합격 항목 수 */
  @Column({ type: 'int', default: 0 })
  failedItems: number;

  /** 점검 일시 */
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  /** 점검자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  inspector: string;

  /** 점검 대상 구역 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  targetZone: string;

  /** 최종 결과 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  finalResult: string;   // 'pass' | 'fail' | 'conditional_pass'

  /** 종합 의견 */
  @Column({ type: 'text', nullable: true })
  overallComment: string;

  /** 연계 시공 계획 ID */
  @Column({ type: 'uuid', nullable: true })
  constructionPlanId: string;

  /** 연계 콘텐츠 설치 ID */
  @Column({ type: 'uuid', nullable: true })
  contentInstallationId: string;

  @Column({ type: 'int', default: 1 })
  inspectionRound: number;   // 1차, 2차(재검수), ...

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
