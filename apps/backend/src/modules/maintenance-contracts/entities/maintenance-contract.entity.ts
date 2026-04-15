/**
 * GWONS_CREATIVE — MaintenanceContract Entity
 * 조달팀: 유지보수 계약 지원
 * Phase 5 운영 — 조달팀 트랙
 * H/W·S/W 납품 이후 유지보수 계약 체결 및 관리
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ContractStatus {
  DRAFTING    = 'drafting',    // 계약서 작성 중
  NEGOTIATING = 'negotiating', // 협상 중
  SIGNED      = 'signed',      // 계약 체결
  ACTIVE      = 'active',      // 유지보수 진행 중
  EXPIRED     = 'expired',     // 계약 만료
  TERMINATED  = 'terminated',  // 중도 해지
}

export enum ContractType {
  HARDWARE    = 'hardware',    // H/W 유지보수
  SOFTWARE    = 'software',    // S/W 유지보수 / 라이선스 갱신
  CONTENT     = 'content',     // 콘텐츠 업데이트 계약
  INTEGRATED  = 'integrated',  // 통합 유지보수
}

/** 유지보수 범위 항목 */
export interface MaintenanceScope {
  itemId: string;
  targetName: string;       // 대상 장비/시스템명
  targetType: 'hardware' | 'software' | 'content';
  coverage: string;         // 보장 범위 설명
  responseTime: string;     // 장애 대응 시간 (예: '4시간 이내')
  visitCount?: number;      // 연간 방문 점검 횟수
  includeParts: boolean;    // 부품비 포함 여부
  purchaseOrderRef?: string; // 원 발주서 참조
}

/** 유지보수 이력 */
export interface MaintenanceRecord {
  recordId: string;
  visitDate: string;
  visitedBy: string;
  targetItems: string[];
  workType: 'inspection' | 'repair' | 'replacement' | 'update';
  description: string;
  result: 'completed' | 'partial' | 'pending';
  nextScheduledDate?: string;
  cost?: number;
  notes?: string;
}

/** SLA (서비스 수준 협약) */
export interface SLAClause {
  clauseId: string;
  metric: string;           // 예: 가동률, 장애 대응 시간
  target: string;           // 목표치 (예: 99.5% 이상)
  penalty?: string;         // 미달 시 패널티
}

@Entity('maintenance_contracts')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'contractType', 'createdAt'])
export class MaintenanceContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractNo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ContractStatus.DRAFTING })
  status: ContractStatus;

  @Column({ type: 'varchar', length: 50 })
  contractType: ContractType;

  /** 계약 업체 정보 */
  @Column({ type: 'varchar', length: 255 })
  vendorName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorContact: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorEmail: string;

  /** 계약 금액 */
  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'KRW' })
  currency: string;

  /** 계약 기간 */
  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  /** 유지보수 범위 */
  @Column({ type: 'jsonb', default: [] })
  maintenanceScope: MaintenanceScope[];

  /** SLA 조항 */
  @Column({ type: 'jsonb', default: [] })
  slaClauses: SLAClause[];

  /** 유지보수 이력 */
  @Column({ type: 'jsonb', default: [] })
  maintenanceRecords: MaintenanceRecord[];

  /** 계약서 파일 URL */
  @Column({ type: 'text', nullable: true })
  contractFileUrl: string;

  /** 담당자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  managedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  signedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

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
