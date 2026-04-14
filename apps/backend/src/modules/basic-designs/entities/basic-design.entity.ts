/**
 * GWONS_CREATIVE — BasicDesign Entity
 * 기획팀: 기본설계서 (전시 공간·구조·시스템 기본 방향 정의)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum BasicDesignStatus {
  DRAFT       = 'draft',
  IN_REVIEW   = 'in_review',
  APPROVED    = 'approved',
  DISTRIBUTED = 'distributed',  // 각 팀에 배포 완료
}

/** 공간 구성 항목 */
export interface SpaceProgram {
  zoneId: string;
  name: string;
  function: string;
  areaSqm: number;
  floorNumber: number;
  heightMm: number;
  structureType: string;
  specialRequirements?: string[];
}

/** 시스템 요구사항 */
export interface SystemRequirement {
  category: 'electrical' | 'mechanical' | 'it' | 'av' | 'lighting' | 'structural';
  description: string;
  specification: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

@Entity('basic_designs')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class BasicDesign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: BasicDesignStatus.DRAFT })
  status: BasicDesignStatus;

  /** 설계 기준 (건축법, 소방법 등) */
  @Column({ type: 'jsonb', default: [] })
  designCriteria: string[];

  /** 공간 프로그램 */
  @Column({ type: 'jsonb', default: [] })
  spacePrograms: SpaceProgram[];

  /** 시스템 요구사항 */
  @Column({ type: 'jsonb', default: [] })
  systemRequirements: SystemRequirement[];

  /** 전체 연면적 */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalFloorAreaSqm: number;

  /** 층수 */
  @Column({ type: 'int', default: 1 })
  totalFloors: number;

  /** 설계 버전 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 배포 일시 (각 팀 작업 착수 기준) */
  @Column({ type: 'timestamptz', nullable: true })
  distributedAt: Date;

  /** 연결된 통합 기획서 */
  @Column({ type: 'uuid', nullable: true })
  integratedPlanId: string;

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
