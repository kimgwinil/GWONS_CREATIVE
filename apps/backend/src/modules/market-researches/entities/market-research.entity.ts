/**
 * GWONS_CREATIVE — MarketResearch Entity
 * 조달팀: H/W·S/W·콘텐츠 시장조사 결과 (공급처 비교·커스텀 가능여부)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ResearchStatus {
  OPEN       = 'open',        // 조사 중
  COMPLETED  = 'completed',   // 조사 완료
  REVIEWED   = 'reviewed',    // 기획팀 검토 완료
  APPROVED   = 'approved',    // 조달 목록 반영 승인
}

export enum ResearchCategory {
  DISPLAY        = 'display',        // 디스플레이·스크린
  SENSOR         = 'sensor',         // 센서·인식 장비
  COMPUTING      = 'computing',      // 컴퓨팅 장비
  STRUCTURE      = 'structure',      // 구조물·전시대
  AUDIO          = 'audio',          // 음향 장비
  LIGHTING_HW    = 'lighting_hw',    // 조명 하드웨어
  SOFTWARE_LIC   = 'software_lic',   // 소프트웨어 라이선스
  CONTENT_DEV    = 'content_dev',    // 콘텐츠 개발
  INSTALLATION   = 'installation',   // 설치·시공
  MAINTENANCE    = 'maintenance',    // 유지보수
}

/** 공급처 견적 항목 */
export interface VendorQuote {
  vendorName: string;
  vendorContact?: string;
  unitPrice: number;
  totalPrice: number;
  currency: 'KRW' | 'USD' | 'EUR';
  leadTimeDays: number;
  warrantyMonths?: number;
  isCustomizable: boolean;
  customizationDetails?: string;
  notes?: string;
  quotedAt: string;
}

/** 기술 사양 비교 */
export interface TechSpec {
  specName: string;
  required: string;
  vendorValues: Record<string, string>;  // { 업체명: 사양값 }
}

@Entity('market_researches')
@Index(['createdAt', 'id'])
@Index(['projectId', 'category', 'createdAt'])
@Index(['projectId', 'status', 'createdAt'])
export class MarketResearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  itemName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: ResearchCategory;

  @Column({ type: 'varchar', length: 50, default: ResearchStatus.OPEN })
  status: ResearchStatus;

  /** 조사 대상 수량 */
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  /** 공급처 견적 목록 (복수 비교) */
  @Column({ type: 'jsonb', default: [] })
  vendorQuotes: VendorQuote[];

  /** 기술 사양 비교표 */
  @Column({ type: 'jsonb', default: [] })
  techSpecs: TechSpec[];

  /** 조달팀 추천 공급처 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  recommendedVendor: string;

  /** 추천 이유 */
  @Column({ type: 'text', nullable: true })
  recommendationReason: string;

  /** 커스텀 가능 여부 최종 판단 */
  @Column({ type: 'boolean', default: false })
  isCustomizable: boolean;

  /** 커스텀 상세 스펙 */
  @Column({ type: 'text', nullable: true })
  customizationSpec: string;

  /** 예상 최저가 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedMinPrice: number;

  /** 예상 최고가 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedMaxPrice: number;

  /** 조사 담당자 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  researchedBy: string;

  /** 연결된 조달 항목 ID */
  @Column({ type: 'uuid', nullable: true })
  procurementItemId: string;

  /** 연결된 상세설계서 콘텐츠 사양 ID */
  @Column({ type: 'varchar', length: 100, nullable: true })
  contentSpecRef: string;

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
