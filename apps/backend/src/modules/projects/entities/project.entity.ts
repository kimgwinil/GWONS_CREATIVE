/**
 * GWONS_CREATIVE — Project Entity
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { Exhibit } from '../../exhibits/entities/exhibit.entity';
import { DesignAsset } from '../../design-assets/entities/design-asset.entity';
import { ProcurementItem } from '../../procurement/entities/procurement-item.entity';

export enum ProjectPhase {
  KICKOFF      = 0,
  PLANNING     = 1,
  DESIGN       = 2,
  PROCUREMENT  = 3,
  IMPLEMENTATION = 4,
  OPERATION    = 5,
}

export enum ProjectStatus {
  DRAFT      = 'draft',
  ACTIVE     = 'active',
  ON_HOLD    = 'on_hold',
  COMPLETED  = 'completed',
  ARCHIVED   = 'archived',
}

@Entity('projects')
@Index(['createdAt', 'id'])  // 인풋 기반 페이징 최적화 인덱스
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'smallint', default: ProjectPhase.KICKOFF })
  phase: ProjectPhase;

  @Column({ type: 'varchar', length: 50, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  /** 컨펌 게이트 기록 (Phase별 컨펌 여부) */
  @Column({ type: 'jsonb', default: {} })
  confirmGates: Record<string, { confirmedAt: string; confirmedBy: string }>;

  @Column({ length: 255, nullable: true })
  clientName: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget: number;

  @OneToMany(() => Exhibit, (e) => e.project)
  exhibits: Exhibit[];

  @OneToMany(() => DesignAsset, (a) => a.project)
  designAssets: DesignAsset[];

  @OneToMany(() => ProcurementItem, (p) => p.project)
  procurementItems: ProcurementItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
