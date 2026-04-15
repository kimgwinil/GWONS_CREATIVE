/**
 * GWONS_CREATIVE — PurchaseOrder Entity
 * 조달팀: H/W 구매 발주서 (디스플레이, 센서, 구조물 등)
 * Phase 3 병렬 — H/W 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum PurchaseOrderStatus {
  DRAFT      = 'draft',       // 발주서 작성 중
  SUBMITTED  = 'submitted',   // 공급업체 제출
  CONFIRMED  = 'confirmed',   // 공급업체 수주 확인
  IN_TRANSIT = 'in_transit',  // 제조·배송 중
  DELIVERED  = 'delivered',   // 납품 완료
  INSPECTED  = 'inspected',   // 검수 완료
  CANCELLED  = 'cancelled',   // 취소
}

export enum PaymentTerms {
  PREPAID    = 'prepaid',     // 선불
  NET_30     = 'net_30',      // 30일 후 지급
  NET_60     = 'net_60',      // 60일 후 지급
  INSTALLMENT = 'installment', // 분할 (계약금+잔금)
  COD        = 'cod',          // 착불
}

/** 발주 항목 */
export interface OrderLineItem {
  lineNo: number;
  itemName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: 'KRW' | 'USD' | 'EUR';
  procurementListItemRef?: number;  // lineNo 참조
}

/** 검수 결과 */
export interface InspectionResult {
  inspectedAt: string;
  inspectedBy: string;
  passedItems: number;
  failedItems: number;
  defectDetails?: string;
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

@Entity('purchase_orders')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'vendorName', 'createdAt'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 발주서 번호 (자동 채번) */
  @Column({ length: 50 })
  orderNo: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus;

  /** 공급업체 */
  @Column({ length: 255 })
  vendorName: string;

  @Column({ length: 255, nullable: true })
  vendorContact: string;

  @Column({ length: 255, nullable: true })
  vendorEmail: string;

  /** 발주 항목 */
  @Column({ type: 'jsonb', default: [] })
  lineItems: OrderLineItem[];

  /** 총 발주 금액 */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'KRW' })
  currency: 'KRW' | 'USD' | 'EUR';

  /** 결제 조건 */
  @Column({ type: 'varchar', length: 50, default: PaymentTerms.NET_30 })
  paymentTerms: PaymentTerms;

  /** 납기 요구일 */
  @Column({ type: 'date', nullable: true })
  requiredDeliveryDate: Date;

  /** 예상 납기일 (공급업체 확인) */
  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  /** 실제 납기일 */
  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  /** 납품 주소 */
  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  /** 검수 결과 */
  @Column({ type: 'jsonb', nullable: true })
  inspectionResult: InspectionResult;

  /** 특이사항 */
  @Column({ type: 'text', nullable: true })
  specialConditions: string;

  /** 참조 조달 목록 */
  @Column({ type: 'uuid', nullable: true })
  procurementListId: string;

  /** 발주 담당자 */
  @Column({ length: 100, nullable: true })
  orderedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date;

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
