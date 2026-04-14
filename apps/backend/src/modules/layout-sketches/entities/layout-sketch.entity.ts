/**
 * GWONS_CREATIVE — LayoutSketch Entity
 * 2D 디자인팀: 기본 평면 레이아웃 스케치 (도면 초안)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum SketchStatus {
  DRAFT    = 'draft',
  SHARED   = 'shared',    // 기획팀에 공유
  APPROVED = 'approved',  // 기획팀 승인
  REVISED  = 'revised',   // 수정 요청 반영
}

export enum SketchType {
  FLOOR_PLAN     = 'floor_plan',      // 평면도
  ELEVATION      = 'elevation',       // 입면도
  SECTION        = 'section',         // 단면도
  CIRCULATION    = 'circulation',     // 동선도
  ZONING         = 'zoning',          // 조닝 다이어그램
  SITE_PLAN      = 'site_plan',       // 배치도
}

/** 도면 구역 정보 */
export interface SketchZone {
  id: string;
  name: string;
  function: string;       // 용도 (전시, 체험, 휴게, 관리 등)
  areaSqm: number;
  color?: string;         // 시각 구분용 색상
  notes?: string;
}

/** 도면 치수 정보 */
export interface DimensionInfo {
  totalWidth: number;     // 전체 폭 (mm)
  totalDepth: number;     // 전체 깊이 (mm)
  ceilingHeight: number;  // 천장고 (mm)
  scale: string;          // 축척 (예: "1:100")
}

@Entity('layout_sketches')
@Index(['createdAt', 'id'])
@Index(['projectId', 'sketchType', 'createdAt'])
export class LayoutSketch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: SketchType.FLOOR_PLAN })
  sketchType: SketchType;

  @Column({ type: 'varchar', length: 50, default: SketchStatus.DRAFT })
  status: SketchStatus;

  /** 스케치 파일 URL (이미지 또는 PDF) */
  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  /** 썸네일 URL */
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  /** 파일 포맷 (.png, .pdf, .dwg 등) */
  @Column({ type: 'varchar', length: 20, nullable: true })
  fileFormat: string;

  /** 도면 구역 정보 */
  @Column({ type: 'jsonb', default: [] })
  zones: SketchZone[];

  /** 치수 정보 */
  @Column({ type: 'jsonb', nullable: true })
  dimensions: DimensionInfo;

  /** 층 번호 */
  @Column({ type: 'int', default: 1 })
  floorNumber: number;

  /** 버전 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 수정 요청 내용 */
  @Column({ type: 'text', nullable: true })
  revisionNotes: string;

  /** 2D팀 작성자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

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
