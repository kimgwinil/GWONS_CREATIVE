/**
 * GWONS_CREATIVE — Moodboard Entity
 * 3D 디자인팀: 공간 무드보드 (레퍼런스·분위기·컬러팔레트)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum MoodboardStatus {
  DRAFT    = 'draft',
  SHARED   = 'shared',    // 팀 공유 완료
  APPROVED = 'approved',  // 기획팀 승인
}

export enum SpaceMood {
  FUTURISTIC  = 'futuristic',
  NATURAL     = 'natural',
  INDUSTRIAL  = 'industrial',
  MINIMALIST  = 'minimalist',
  PLAYFUL     = 'playful',
  DRAMATIC    = 'dramatic',
  WARM        = 'warm',
  COOL        = 'cool',
}

/** 레퍼런스 이미지 아이템 */
export interface ReferenceItem {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl?: string;
  description?: string;
  tags: string[];
  category: 'space' | 'lighting' | 'material' | 'color' | 'structure' | 'other';
}

/** 컬러 팔레트 아이템 */
export interface ColorPaletteItem {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
  usage?: string;
}

@Entity('moodboards')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class Moodboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** 공간 분위기 키워드 */
  @Column({ type: 'varchar', length: 50, default: SpaceMood.FUTURISTIC })
  mood: SpaceMood;

  /** 레퍼런스 이미지 목록 */
  @Column({ type: 'jsonb', default: [] })
  references: ReferenceItem[];

  /** 컬러 팔레트 */
  @Column({ type: 'jsonb', default: [] })
  colorPalette: ColorPaletteItem[];

  /** 소재·마감 키워드 */
  @Column({ type: 'jsonb', default: [] })
  materialKeywords: string[];

  /** 조명 콘셉트 */
  @Column({ type: 'text', nullable: true })
  lightingConcept: string;

  /** 3D 팀 작성자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 50, default: MoodboardStatus.DRAFT })
  status: MoodboardStatus;

  /** 연결된 콘셉트 기획서 ID */
  @Column({ type: 'uuid', nullable: true })
  conceptPlanId: string;

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
