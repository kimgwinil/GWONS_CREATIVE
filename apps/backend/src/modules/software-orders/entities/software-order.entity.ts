/**
 * GWONS_CREATIVE — SoftwareOrder Entity
 * 조달팀: S/W 라이선스 구매 및 커스텀 콘텐츠 개발 의뢰
 * Phase 3 병렬 — S/W·콘텐츠 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum SoftwareOrderStatus {
  DRAFT        = 'draft',         // 작성 중
  SUBMITTED    = 'submitted',     // 개발사/공급사 제출
  CONTRACTED   = 'contracted',    // 계약 체결
  IN_PROGRESS  = 'in_progress',   // 개발·제작 중
  TESTING      = 'testing',       // 테스트/검수 중
  DELIVERED    = 'delivered',     // 납품 완료
  ACCEPTED     = 'accepted',      // 최종 수락
  CANCELLED    = 'cancelled',     // 취소
}

export enum SoftwareOrderType {
  LICENSE      = 'license',       // S/W 라이선스 구매
  CUSTOM_DEV   = 'custom_dev',    // 커스텀 개발 의뢰
  CONTENT      = 'content',       // 콘텐츠 제작 의뢰
  MAINTENANCE  = 'maintenance',   // 유지보수 계약
  SAAS         = 'saas',          // SaaS 구독
}

/** 개발 마일스톤 */
export interface DevMilestone {
  milestoneNo: number;
  name: string;
  description: string;
  plannedDate: string;
  actualDate?: string;
  deliverable: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  paymentRatio?: number;   // 마일스톤별 지급 비율 (%)
}

/** 기술 요구사항 */
export interface TechRequirement {
  reqId: string;
  category: string;
  description: string;
  priority: 'must' | 'should' | 'nice';
  isCustomizable: boolean;
}

/** 테스트 결과 */
export interface TestResult {
  testedAt: string;
  testedBy: string;
  totalTestCases: number;
  passedCases: number;
  failedCases: number;
  issues: string[];
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

@Entity('software_orders')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'orderType', 'createdAt'])
export class SoftwareOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 발주서 번호 */
  @Column({ length: 50 })
  orderNo: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  orderType: SoftwareOrderType;

  @Column({ type: 'varchar', length: 50, default: SoftwareOrderStatus.DRAFT })
  status: SoftwareOrderStatus;

  /** 개발사/공급사 */
  @Column({ length: 255 })
  vendorName: string;

  @Column({ length: 255, nullable: true })
  vendorContact: string;

  /** 계약 금액 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'KRW' })
  currency: 'KRW' | 'USD' | 'EUR';

  /** 커스텀 개발 여부 */
  @Column({ type: 'boolean', default: false })
  isCustomDevelopment: boolean;

  /** 기술 요구사항 */
  @Column({ type: 'jsonb', default: [] })
  techRequirements: TechRequirement[];

  /** 개발 마일스톤 (커스텀 개발 시) */
  @Column({ type: 'jsonb', default: [] })
  milestones: DevMilestone[];

  /** 라이선스 수량 (라이선스 구매 시) */
  @Column({ type: 'int', nullable: true })
  licenseCount: number;

  /** 라이선스 유효 기간 (개월) */
  @Column({ type: 'int', nullable: true })
  licenseMonths: number;

  /** 납기 요구일 */
  @Column({ type: 'date', nullable: true })
  requiredDeliveryDate: Date;

  /** 예상 납기일 */
  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  /** 실제 납기일 */
  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  /** 계약서 파일 URL */
  @Column({ type: 'text', nullable: true })
  contractFileUrl: string;

  /** 테스트 결과 */
  @Column({ type: 'jsonb', nullable: true })
  testResult: TestResult;

  /** 납품물 파일 URL */
  @Column({ type: 'text', nullable: true })
  deliverableFileUrl: string;

  /** 특이사항 */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /** 참조 조달 목록 */
  @Column({ type: 'uuid', nullable: true })
  procurementListId: string;

  @Column({ length: 100, nullable: true })
  orderedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  contractedAt: Date;

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
