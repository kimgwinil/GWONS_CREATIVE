/**
 * GWONS_CREATIVE — Design Asset Entity (3D / 2D 에셋)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum TeamType {
  TEAM_3D = '3d',
  TEAM_2D = '2d',
}

export enum AssetType {
  MODEL    = 'model',    // 3D 모델 (.glb, .obj)
  RENDER   = 'render',   // 렌더링 이미지
  DRAWING  = 'drawing',  // 2D 도면 (.dwg, .pdf)
  MOODBOARD = 'moodboard', // 무드보드
  SKETCH   = 'sketch',   // 스케치
}

export enum AssetStatus {
  DRAFT     = 'draft',
  REVIEW    = 'review',
  APPROVED  = 'approved',
}

@Entity('design_assets')
@Index(['createdAt', 'id'])          // 커서 페이징 최적화 인덱스
@Index(['projectId', 'teamType', 'createdAt'])
export class DesignAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  teamType: TeamType;   // '3d' | '2d'

  @Column({ type: 'varchar', length: 50 })
  assetType: AssetType;

  @Column({ type: 'varchar', length: 50, default: AssetStatus.DRAFT })
  status: AssetStatus;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fileFormat: string;  // .glb, .obj, .dwg, .pdf ...

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** 버전 관리 */
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (p) => p.designAssets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 100, nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
