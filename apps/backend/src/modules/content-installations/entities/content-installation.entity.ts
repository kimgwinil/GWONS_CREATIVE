/**
 * GWONS_CREATIVE — ContentInstallation Entity
 * 소프트웨어팀: 콘텐츠 설치 + 시스템 연동
 * Phase 4 병렬 — 소프트웨어·콘텐츠 트랙
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum InstallationStatus {
  PENDING        = 'pending',         // 설치 대기
  IN_PROGRESS    = 'in_progress',     // 설치 진행 중
  INTEGRATION    = 'integration',     // 시스템 연동 중
  TESTING        = 'testing',         // 설치 후 테스트
  COMPLETED      = 'completed',       // 설치 완료
  FAILED         = 'failed',          // 설치 실패
}

export enum ContentType {
  INTERACTIVE    = 'interactive',     // 인터랙티브 콘텐츠
  VIDEO          = 'video',           // 영상 콘텐츠
  AUDIO          = 'audio',           // 오디오 가이드
  AR_VR          = 'ar_vr',           // AR/VR 체험
  KIOSK          = 'kiosk',           // 키오스크 소프트웨어
  CONTROL_SYSTEM = 'control_system',  // 전시 제어 시스템
  SENSOR         = 'sensor',          // 센서 연동
  LIGHTING       = 'lighting',        // 조명 제어
}

/** 설치 항목 */
export interface InstallationItem {
  itemId: string;
  contentName: string;
  contentType: ContentType;
  targetDevice: string;         // 설치 대상 장비
  targetZone: string;
  version: string;
  installedBy: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'installed' | 'failed' | 'rolled_back';
  errorLog?: string;
  notes?: string;
  softwareOrderRef?: string;    // S/W 발주서 참조
}

/** 시스템 연동 테스트 결과 */
export interface IntegrationTestResult {
  testId: string;
  testName: string;
  targetSystems: string[];
  testedAt: string;
  testedBy: string;
  result: 'pass' | 'fail' | 'partial';
  errorDetails?: string;
  notes?: string;
}

/** 기술 이슈 */
export interface TechIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  affectedItems: string[];
  reportedAt: string;
  reportedBy: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolvedAt?: string;
  resolution?: string;
}

@Entity('content_installations')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class ContentInstallation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: InstallationStatus.PENDING })
  status: InstallationStatus;

  /** 설치 항목 목록 */
  @Column({ type: 'jsonb', default: [] })
  installationItems: InstallationItem[];

  /** 시스템 연동 테스트 결과 */
  @Column({ type: 'jsonb', default: [] })
  integrationTests: IntegrationTestResult[];

  /** 기술 이슈 목록 */
  @Column({ type: 'jsonb', default: [] })
  techIssues: TechIssue[];

  /** 전체 설치 항목 수 */
  @Column({ type: 'int', default: 0 })
  totalItems: number;

  /** 설치 완료 항목 수 */
  @Column({ type: 'int', default: 0 })
  installedItems: number;

  /** 실패 항목 수 */
  @Column({ type: 'int', default: 0 })
  failedItems: number;

  /** 설치 시작일 */
  @Column({ type: 'date', nullable: true })
  plannedStartDate: Date;

  /** 설치 완료 목표일 */
  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  /** 실제 완료일 */
  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  /** 설치 책임자 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  installationLead: string;

  /** 연계 S/W 발주서 ID */
  @Column({ type: 'uuid', nullable: true })
  softwareOrderId: string;

  /** 연계 시공 계획 ID */
  @Column({ type: 'uuid', nullable: true })
  constructionPlanId: string;

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
