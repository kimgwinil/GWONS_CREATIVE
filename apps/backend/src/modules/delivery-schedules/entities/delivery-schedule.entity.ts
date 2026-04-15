/**
 * GWONS_CREATIVE — DeliverySchedule Entity
 * 조달팀 + 기획팀: H/W·S/W 납품 일정 통합 관리
 * Phase 3 합류 — 납품·검수 스케줄 조율
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum DeliveryScheduleStatus {
  PLANNING    = 'planning',     // 일정 계획 중
  CONFIRMED   = 'confirmed',    // 납품 일정 확정
  IN_PROGRESS = 'in_progress',  // 납품 진행 중
  COMPLETED   = 'completed',    // 전체 납품 완료
  DELAYED     = 'delayed',      // 지연
}

/** 납품 이벤트 */
export interface DeliveryEvent {
  eventId: string;
  orderType: 'purchase' | 'software';
  orderId: string;
  orderNo: string;
  itemSummary: string;
  vendorName: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'delivered' | 'delayed' | 'cancelled';
  location?: string;
  notes?: string;
  delayDays?: number;
  delayReason?: string;
}

/** 설치 일정 연계 */
export interface InstallationLink {
  zone: string;
  requiredByDate: string;
  linkedOrderIds: string[];
  notes?: string;
}

@Entity('delivery_schedules')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class DeliverySchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: DeliveryScheduleStatus.PLANNING })
  status: DeliveryScheduleStatus;

  /** 납품 이벤트 목록 (H/W + S/W 통합) */
  @Column({ type: 'jsonb', default: [] })
  deliveryEvents: DeliveryEvent[];

  /** 설치 일정 연계 정보 */
  @Column({ type: 'jsonb', default: [] })
  installationLinks: InstallationLink[];

  /** 전체 납품 완료 목표일 */
  @Column({ type: 'date', nullable: true })
  targetCompletionDate: Date;

  /** 실제 완료일 */
  @Column({ type: 'date', nullable: true })
  actualCompletionDate: Date;

  /** 총 이벤트 수 */
  @Column({ type: 'int', default: 0 })
  totalEvents: number;

  /** 완료된 이벤트 수 */
  @Column({ type: 'int', default: 0 })
  completedEvents: number;

  /** 지연 이벤트 수 */
  @Column({ type: 'int', default: 0 })
  delayedEvents: number;

  /** 참조 조달 목록 */
  @Column({ type: 'uuid', nullable: true })
  procurementListId: string;

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
