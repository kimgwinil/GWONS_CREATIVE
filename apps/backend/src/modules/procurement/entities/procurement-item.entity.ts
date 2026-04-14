/**
 * GWONS_CREATIVE — Procurement Item Entity (조달 항목)
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ProcurementCategory {
  HARDWARE = 'hardware',    // H/W (디스플레이, 센서, 구조물 등)
  SOFTWARE = 'software',    // S/W (라이선스, 솔루션 등)
  CONTENT  = 'content',     // 콘텐츠 (영상, 음향 등)
  SERVICE  = 'service',     // 서비스 (설치, 유지보수 등)
  MATERIAL = 'material',    // 자재
}

export enum ProcurementStatus {
  RESEARCHING  = 'researching',   // 시장조사 중
  REVIEWING    = 'reviewing',     // 검토 중
  APPROVED     = 'approved',      // 조달 승인
  ORDERED      = 'ordered',       // 발주 완료
  DELIVERING   = 'delivering',    // 납품 중
  DELIVERED    = 'delivered',     // 납품 완료
  CANCELLED    = 'cancelled',     // 취소
}

@Entity('procurement_items')
@Index(['createdAt', 'id'])           // 커서 페이징 최적화 인덱스
@Index(['projectId', 'category', 'createdAt'])
@Index(['projectId', 'status', 'createdAt'])
export class ProcurementItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: ProcurementCategory;

  @Column({ type: 'varchar', length: 50, default: ProcurementStatus.RESEARCHING })
  status: ProcurementStatus;

  /** 커스텀 개발 가능 여부 */
  @Column({ type: 'boolean', default: false })
  isCustomizable: boolean;

  /** 커스텀 사양 상세 */
  @Column({ type: 'text', nullable: true })
  customSpec: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  actualCost: number;

  @Column({ length: 255, nullable: true })
  vendor: string;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date;

  /** 시장조사 결과 (복수 공급처 비교) */
  @Column({ type: 'jsonb', nullable: true })
  marketResearch: Array<{
    vendor: string;
    price: number;
    deliveryDays: number;
    notes: string;
  }>;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (p) => p.procurementItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
