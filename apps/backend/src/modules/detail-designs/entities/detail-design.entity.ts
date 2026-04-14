/**
 * GWONS_CREATIVE — DetailDesign Entity
 * 기획팀: 상세설계서 (구체적 사양·치수·마감재·설비 명세)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum DetailDesignStatus {
  DRAFT     = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED  = 'approved',
  FINAL     = 'final',
}

/** 마감재 명세 */
export interface FinishSpec {
  location: string;
  material: string;
  finish: string;
  colorCode?: string;
  manufacturer?: string;
  modelNo?: string;
  unit: 'sqm' | 'lm' | 'ea';
  quantity: number;
}

/** 설비·장비 사양 */
export interface EquipmentSpec {
  category: string;
  name: string;
  manufacturer?: string;
  modelNo?: string;
  specification: string;
  quantity: number;
  unit: string;
  installLocation: string;
  powerRequirement?: string;
  notes?: string;
}

/** 인터랙티브 콘텐츠 사양 */
export interface ContentSpec {
  exhibitId?: string;
  title: string;
  contentType: 'video' | 'interactive' | 'ar' | 'vr' | 'projection' | 'sensor' | 'audio';
  resolution?: string;
  screenSize?: string;
  interactionMethod?: string;
  softwarePlatform?: string;
  hardwareSpec?: string;
  notes?: string;
}

@Entity('detail_designs')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class DetailDesign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: DetailDesignStatus.DRAFT })
  status: DetailDesignStatus;

  /** 마감재 명세 목록 */
  @Column({ type: 'jsonb', default: [] })
  finishSpecs: FinishSpec[];

  /** 설비·장비 사양 목록 */
  @Column({ type: 'jsonb', default: [] })
  equipmentSpecs: EquipmentSpec[];

  /** 인터랙티브 콘텐츠 사양 목록 */
  @Column({ type: 'jsonb', default: [] })
  contentSpecs: ContentSpec[];

  /** 전기 용량 (kW) */
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  totalPowerKw: number;

  /** 예상 공사비 (원) */
  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true })
  estimatedConstructionCost: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  /** 연결된 기본설계서 */
  @Column({ type: 'uuid', nullable: true })
  basicDesignId: string;

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
