/**
 * GWONS_CREATIVE — Exhibit Entity (전시 콘텐츠)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ExhibitStatus {
  DRAFT     = 'draft',
  REVIEW    = 'review',
  APPROVED  = 'approved',
  INSTALLED = 'installed',
}

export enum ExhibitCategory {
  INTERACTIVE = 'interactive',   // 인터랙티브 체험
  DISPLAY     = 'display',       // 디스플레이 전시
  INSTALLATION = 'installation', // 설치 작품
  DIGITAL     = 'digital',       // 디지털 미디어
  PHYSICAL    = 'physical',      // 물리적 체험
}

@Entity('exhibits')
@Index(['createdAt', 'id'])   // 커서 페이징 최적화 인덱스
@Index(['projectId', 'createdAt'])
export class Exhibit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: ExhibitCategory;

  @Column({ type: 'varchar', length: 50, default: ExhibitStatus.DRAFT })
  status: ExhibitStatus;

  /** 체험 시나리오 시퀀스 정보 */
  @Column({ type: 'jsonb', nullable: true })
  scenario: Record<string, unknown>;

  /** 전시 순서 (동선) */
  @Column({ type: 'int', default: 0 })
  sequence: number;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'int', nullable: true })
  capacityPerSession: number;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (p) => p.exhibits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
