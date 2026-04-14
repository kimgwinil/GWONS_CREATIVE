/**
 * GWONS_CREATIVE — CadDrawing Entity
 * 2D 디자인팀: 건축·구조·설비 도면 (실시 도면 수준)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum DrawingStatus {
  DRAFT     = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED  = 'approved',
  ISSUED    = 'issued',      // 시공용 발행
  REVISED   = 'revised',     // 수정 중
}

export enum DrawingDiscipline {
  ARCHITECTURAL = 'architectural',   // 건축
  STRUCTURAL    = 'structural',      // 구조
  MECHANICAL    = 'mechanical',      // 기계
  ELECTRICAL    = 'electrical',      // 전기
  IT_NETWORK    = 'it_network',      // IT·네트워크
  INTERIOR      = 'interior',        // 인테리어
  AV_SYSTEM     = 'av_system',       // AV 시스템
  LIGHTING      = 'lighting',        // 조명
}

export enum DrawingType {
  PLAN          = 'plan',            // 평면도
  ELEVATION     = 'elevation',       // 입면도
  SECTION       = 'section',         // 단면도
  DETAIL        = 'detail',          // 상세도
  SCHEDULE      = 'schedule',        // 일람표
  DIAGRAM       = 'diagram',         // 다이어그램
  SITE_PLAN     = 'site_plan',       // 배치도
}

/** 도면 개정 이력 */
export interface RevisionHistory {
  revisionNo: string;     // 'A', 'B', '1', '2' ...
  date: string;
  description: string;
  revisedBy: string;
  checkedBy?: string;
}

/** 도면 레이어 정보 */
export interface DrawingLayer {
  name: string;
  color: string;
  description: string;
  isVisible: boolean;
}

@Entity('cad_drawings')
@Index(['createdAt', 'id'])
@Index(['projectId', 'discipline', 'createdAt'])
@Index(['projectId', 'status', 'createdAt'])
export class CadDrawing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 도면 번호 (예: A-001, S-002) */
  @Column({ length: 50 })
  drawingNo: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  discipline: DrawingDiscipline;

  @Column({ type: 'varchar', length: 50 })
  drawingType: DrawingType;

  @Column({ type: 'varchar', length: 50, default: DrawingStatus.DRAFT })
  status: DrawingStatus;

  /** 축척 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  scale: string;

  /** 도면 크기 */
  @Column({ type: 'varchar', length: 10, nullable: true })
  paperSize: string;   // 'A0', 'A1', 'A2', 'A3'

  /** 층 번호 */
  @Column({ type: 'int', default: 1 })
  floorNumber: number;

  /** 파일 URL (.dwg / .pdf / .dxf) */
  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  /** PDF 뷰어용 URL */
  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  /** 썸네일 */
  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  /** 현재 개정 번호 */
  @Column({ type: 'varchar', length: 10, default: 'A' })
  currentRevision: string;

  /** 개정 이력 */
  @Column({ type: 'jsonb', default: [] })
  revisionHistory: RevisionHistory[];

  /** 도면 레이어 구성 */
  @Column({ type: 'jsonb', default: [] })
  layers: DrawingLayer[];

  /** 작성자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  drawnBy: string;

  /** 검토자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  checkedBy: string;

  /** 승인자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  /** 발행일 (시공용) */
  @Column({ type: 'timestamptz', nullable: true })
  issuedAt: Date;

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
