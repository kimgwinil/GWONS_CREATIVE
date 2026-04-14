/**
 * GWONS_CREATIVE — ConceptPlan Entity
 * 기획팀: 전시 콘셉트 기획서
 * (주제·동선·체험요소·관람 흐름 종합 문서)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ConceptPlanStatus {
  DRAFT        = 'draft',
  IN_REVIEW    = 'in_review',
  APPROVED     = 'approved',
  REJECTED     = 'rejected',
  FINAL        = 'final',
}

export enum ExhibitionTheme {
  SCIENCE      = 'science',
  HISTORY      = 'history',
  ART          = 'art',
  NATURE       = 'nature',
  TECHNOLOGY   = 'technology',
  CULTURE      = 'culture',
  CUSTOM       = 'custom',
}

/** 동선 구간 정의 */
export interface CirculationZone {
  zoneId: string;
  name: string;
  description: string;
  areaSqm: number;
  capacity: number;
  exhibits: string[];       // exhibit ID 참조
  entryPoints: string[];
  exitPoints: string[];
}

/** 체험 요소 */
export interface ExperienceElement {
  id: string;
  type: 'digital' | 'physical' | 'hybrid';
  title: string;
  description: string;
  targetAge?: string;
  requiredSpace?: number;
}

@Entity('concept_plans')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class ConceptPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  /** 전시 주제 */
  @Column({ type: 'varchar', length: 50, default: ExhibitionTheme.CUSTOM })
  theme: ExhibitionTheme;

  /** 핵심 콘셉트 (한 줄 슬로건) */
  @Column({ type: 'text', nullable: true })
  conceptStatement: string;

  /** 전시 목표 */
  @Column({ type: 'text', nullable: true })
  objectives: string;

  /** 타겟 관람객 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  targetAudience: string;

  /** 전시 기간 */
  @Column({ type: 'int', nullable: true })
  exhibitionDays: number;

  /** 예상 일일 관람객 수 */
  @Column({ type: 'int', nullable: true })
  expectedDailyVisitors: number;

  /** 동선 구간 목록 */
  @Column({ type: 'jsonb', default: [] })
  circulationZones: CirculationZone[];

  /** 체험 요소 목록 */
  @Column({ type: 'jsonb', default: [] })
  experienceElements: ExperienceElement[];

  /** 전체 전시 면적 (㎡) */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAreaSqm: number;

  @Column({ type: 'varchar', length: 50, default: ConceptPlanStatus.DRAFT })
  status: ConceptPlanStatus;

  /** 버전 이력 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 검토 의견 */
  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  /** 연결된 시나리오 ID 목록 */
  @Column({ type: 'jsonb', default: [] })
  linkedScenarioIds: string[];

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
