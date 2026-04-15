/**
 * GWONS_CREATIVE — OperationGuide Entity
 * 기획팀: 오픈 운영 가이드 전달
 * Phase 5 운영 — 기획팀 트랙
 * Gate #4 통과 후 현장 운영 매뉴얼 작성 및 전달
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum OperationGuideStatus {
  DRAFTING    = 'drafting',     // 작성 중
  IN_REVIEW   = 'in_review',   // 내부 검토
  APPROVED    = 'approved',    // 승인 완료
  DELIVERED   = 'delivered',   // 현장 전달 완료
  REVISED     = 'revised',     // 개정판
}

export enum GuideCategory {
  DAILY_OPERATION  = 'daily_operation',   // 일상 운영
  EMERGENCY        = 'emergency',          // 비상 대응
  MAINTENANCE      = 'maintenance',        // 유지보수
  VISITOR_GUIDE    = 'visitor_guide',      // 관람객 안내
  STAFF_TRAINING   = 'staff_training',     // 직원 교육
  TECHNICAL        = 'technical',          // 기술 운영
}

/** 운영 절차 단계 */
export interface OperationStep {
  stepNo: number;
  title: string;
  description: string;
  responsible: string;    // 담당자/팀
  duration?: string;      // 소요 시간
  tools?: string[];       // 필요 도구/장비
  caution?: string;       // 주의 사항
  checkPoint?: string;    // 확인 사항
}

/** 비상 연락망 */
export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
  email?: string;
  availableHours?: string;
}

/** 운영 시간표 */
export interface OperatingSchedule {
  dayOfWeek: string;      // 'weekday' | 'saturday' | 'sunday' | 'holiday'
  openTime: string;
  closeTime: string;
  staffCount: number;
  note?: string;
}

@Entity('operation_guides')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
@Index(['projectId', 'category', 'createdAt'])
export class OperationGuide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: OperationGuideStatus.DRAFTING })
  status: OperationGuideStatus;

  @Column({ type: 'varchar', length: 50 })
  category: GuideCategory;

  /** 운영 절차 */
  @Column({ type: 'jsonb', default: [] })
  steps: OperationStep[];

  /** 비상 연락망 */
  @Column({ type: 'jsonb', default: [] })
  emergencyContacts: EmergencyContact[];

  /** 운영 시간표 */
  @Column({ type: 'jsonb', default: [] })
  operatingSchedule: OperatingSchedule[];

  /** 버전 */
  @Column({ type: 'int', default: 1 })
  version: number;

  /** 문서 파일 URL */
  @Column({ type: 'text', nullable: true })
  documentUrl: string;

  /** 작성자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string;

  /** 승인자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

  /** 전달 대상 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  deliveredTo: string;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  /** 유효 기간 (개정 주기) */
  @Column({ type: 'date', nullable: true })
  validUntil: Date;

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
