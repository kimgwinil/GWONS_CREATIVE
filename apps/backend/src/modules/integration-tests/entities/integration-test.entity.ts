/**
 * GWONS_CREATIVE — IntegrationTest Entity
 * 기획팀: 전시 통합 테스트 + 시뮬레이션 검증
 * Phase 4 합류 — 컨펌 게이트 #4
 * 통과 시 Phase 5(운영) 착수
 */
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum IntegrationTestStatus {
  PREPARING      = 'preparing',       // 통합 테스트 준비
  IN_SIMULATION  = 'in_simulation',   // 시뮬레이션 진행 중
  IN_REVIEW      = 'in_review',       // 기획팀 검토 중
  CLIENT_REVIEW  = 'client_review',   // 클라이언트 검토
  APPROVED       = 'approved',        // 게이트 #4 통과 → Phase 5 착수
  REJECTED       = 'rejected',        // 반려
}

/** Phase 4 산출물 체크리스트 */
export interface Phase4Deliverable {
  teamName: string;
  deliverableType: 'construction_plan' | 'site_visualization' | 'content_installation' | 'quality_inspection';
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  inspectionResult?: string;
  notes?: string;
}

/** 시뮬레이션 시나리오 */
export interface SimulationScenario {
  scenarioId: string;
  name: string;
  description: string;
  targetAudience: string;
  steps: Array<{
    stepNo: number;
    zone: string;
    action: string;
    expectedResult: string;
    actualResult?: string;
    result?: 'pass' | 'fail' | 'partial';
    testerNote?: string;
  }>;
  totalSteps: number;
  passedSteps: number;
  overallResult?: 'pass' | 'fail' | 'partial';
  simulatedAt?: string;
  simulatedBy?: string;
}

/** 최종 체크리스트 항목 */
export interface FinalCheckItem {
  checkId: string;
  category: string;
  description: string;
  result: 'pass' | 'fail' | 'na' | 'pending';
  note?: string;
}

/** 운영 이슈 */
export interface OperationIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  status: 'open' | 'resolved';
  resolution?: string;
}

@Entity('integration_tests')
@Index(['createdAt', 'id'])
@Index(['projectId', 'status', 'createdAt'])
export class IntegrationTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  executiveSummary: string;

  @Column({ type: 'varchar', length: 50, default: IntegrationTestStatus.PREPARING })
  status: IntegrationTestStatus;

  /** Phase 4 산출물 체크리스트 */
  @Column({ type: 'jsonb', default: [] })
  deliverables: Phase4Deliverable[];

  /** 시뮬레이션 시나리오 목록 */
  @Column({ type: 'jsonb', default: [] })
  simulations: SimulationScenario[];

  /** 최종 체크리스트 */
  @Column({ type: 'jsonb', default: [] })
  finalChecklist: FinalCheckItem[];

  /** 운영 이슈 */
  @Column({ type: 'jsonb', default: [] })
  operationIssues: OperationIssue[];

  /** 전체 시뮬레이션 결과 */
  @Column({ type: 'varchar', length: 50, nullable: true })
  simulationResult: string;   // 'pass' | 'fail' | 'partial'

  /** 전체 합격 여부 */
  @Column({ type: 'boolean', nullable: true })
  isFullyPassed: boolean;

  @Column({ type: 'text', nullable: true })
  clientFeedback: string;

  @Column({ type: 'text', nullable: true })
  internalNotes: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  /** 연계 시공 계획 ID */
  @Column({ type: 'uuid', nullable: true })
  constructionPlanId: string;

  /** 연계 콘텐츠 설치 ID */
  @Column({ type: 'uuid', nullable: true })
  contentInstallationId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date;

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
