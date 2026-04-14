/**
 * GWONS_CREATIVE — RenderAsset Entity
 * 3D 디자인팀: 3D 모델링 파일 및 렌더링 이미지 관리
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum RenderAssetStatus {
  MODELING    = 'modeling',    // 모델링 작업 중
  RENDERING   = 'rendering',   // 렌더링 중
  REVIEW      = 'review',      // 검토 요청
  APPROVED    = 'approved',    // 기획팀 승인
  FINAL       = 'final',       // 최종본
}

export enum RenderAssetType {
  MODEL_3D    = 'model_3d',    // .glb / .obj / .fbx
  RENDER_IMG  = 'render_img',  // 렌더링 이미지 (.png / .jpg)
  ANIMATION   = 'animation',   // 애니메이션 (.mp4 / .glb)
  VR_SCENE    = 'vr_scene',    // VR 씬 파일
  PANORAMA    = 'panorama',    // 360° 파노라마
}

export enum RenderViewType {
  EXTERIOR      = 'exterior',       // 외관
  INTERIOR      = 'interior',       // 내부
  BIRDS_EYE     = 'birds_eye',      // 조감도
  DETAIL        = 'detail',         // 디테일 샷
  WALKTHROUGH   = 'walkthrough',    // 워크스루
}

/** LOD(Level of Detail) 레벨 */
export type LodLevel = 'lod0' | 'lod1' | 'lod2' | 'lod3';

/** 렌더링 설정 */
export interface RenderSettings {
  resolution: string;        // '1920x1080', '4096x2048' 등
  engine: string;            // 'cycles' | 'eevee' | 'corona' | 'vray'
  samples?: number;
  lightingSetup?: string;
  postProcessing?: string[];
}

@Entity('render_assets')
@Index(['createdAt', 'id'])
@Index(['projectId', 'assetType', 'createdAt'])
@Index(['projectId', 'status', 'createdAt'])
export class RenderAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  assetType: RenderAssetType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  viewType: RenderViewType;

  @Column({ type: 'varchar', length: 50, default: RenderAssetStatus.MODELING })
  status: RenderAssetStatus;

  /** 원본 파일 URL (3D 모델 / 씬 파일) */
  @Column({ type: 'text', nullable: true })
  sourceFileUrl: string;

  /** 출력 파일 URL (렌더 이미지 / 영상) */
  @Column({ type: 'text', nullable: true })
  outputFileUrl: string;

  /** 썸네일 */
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  /** 파일 포맷 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  fileFormat: string;

  /** 파일 크기 (bytes) */
  @Column({ type: 'bigint', nullable: true })
  fileSizeBytes: number;

  /** LOD 레벨 (3D 모델 최적화용) */
  @Column({ type: 'varchar', length: 10, nullable: true })
  lodLevel: LodLevel;

  /** 렌더링 설정 */
  @Column({ type: 'jsonb', nullable: true })
  renderSettings: RenderSettings;

  /** 연결된 전시 공간 구역 ID */
  @Column({ type: 'varchar', length: 100, nullable: true })
  targetZoneId: string;

  /** 버전 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 작성자 (3D 디자이너) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  /** 검토 의견 */
  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

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
