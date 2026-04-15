/**
 * GWONS_CREATIVE — IntegrationTestsService Unit Tests
 * Phase 4 기획팀: 전시 통합 테스트 + 컨펌 게이트 #4
 * preparing → in_simulation → in_review → client_review → approved
 * 통과 시 Phase 5(운영) 착수
 */
import { IntegrationTestsService } from '../integration-tests.service';
import {
  IntegrationTest, IntegrationTestStatus,
  Phase4Deliverable, SimulationScenario, OperationIssue,
} from '../entities/integration-test.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeDeliverables = (): Phase4Deliverable[] => [
  {
    teamName: '시공팀',
    deliverableType: 'construction_plan',
    deliverableId: 'cp-001',
    deliverableTitle: '전시관 A동 시공 계획서 v1',
    isCompleted: true,
    completedAt: '2026-08-31T18:00:00Z',
    inspectionResult: 'inspected',
  },
  {
    teamName: '3D 디자인팀',
    deliverableType: 'site_visualization',
    deliverableId: 'sv-001',
    deliverableTitle: '메인 전시홀 준공 후 시각화 v1',
    isCompleted: true,
    completedAt: '2026-08-28T15:00:00Z',
    inspectionResult: 'final',
  },
  {
    teamName: '소프트웨어팀',
    deliverableType: 'content_installation',
    deliverableId: 'ci-001',
    deliverableTitle: '전시관 A동 콘텐츠 설치 패키지',
    isCompleted: true,
    completedAt: '2026-08-30T17:00:00Z',
    inspectionResult: 'completed',
  },
  {
    teamName: '기획팀',
    deliverableType: 'quality_inspection',
    deliverableId: 'qi-001',
    deliverableTitle: '전시관 A동 1차 품질 점검',
    isCompleted: true,
    completedAt: '2026-09-01T12:00:00Z',
    inspectionResult: 'pass',
  },
];

const makeSimulations = (): SimulationScenario[] => [
  {
    scenarioId: 'sim-001',
    name: '일반 관람객 체험 시뮬레이션',
    description: '입장부터 전시 관람까지의 전체 흐름 테스트',
    targetAudience: '일반 성인 관람객',
    steps: [
      { stepNo: 1, zone: 'Entrance', action: '입장 및 티켓 확인', expectedResult: '키오스크 정상 작동' },
      { stepNo: 2, zone: 'Zone-A', action: '메인 전시 관람', expectedResult: '미디어 월 정상 재생' },
      { stepNo: 3, zone: 'Zone-B', action: '체험존 인터랙션', expectedResult: '터치 반응 정상' },
    ],
    totalSteps: 3,
    passedSteps: 0,
  },
  {
    scenarioId: 'sim-002',
    name: '단체 관람객 시뮬레이션',
    description: '30명 단체 관람 동선 + 혼잡도 테스트',
    targetAudience: '학생 단체',
    steps: [
      { stepNo: 1, zone: 'Entrance', action: '단체 입장', expectedResult: '원활한 입장 처리' },
      { stepNo: 2, zone: 'Zone-A', action: '가이드 투어', expectedResult: '동선 충돌 없음' },
    ],
    totalSteps: 2,
    passedSteps: 0,
  },
];

const makeTest = (overrides: Partial<IntegrationTest> = {}): IntegrationTest => ({
  id: 'it-001',
  title: '전시관 A동 Phase 4 통합 테스트',
  executiveSummary: 'Phase 4 전체 산출물 통합 검증',
  status: IntegrationTestStatus.PREPARING,
  deliverables: makeDeliverables(),
  simulations: makeSimulations(),
  finalChecklist: [],
  operationIssues: [],
  simulationResult: null as any,
  isFullyPassed: null as any,
  clientFeedback: null as any,
  internalNotes: '내부 준비 완료',
  version: 1,
  constructionPlanId: 'cp-001',
  contentInstallationId: 'ci-001',
  approvedBy: null as any,
  approvedAt: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-09-01T10:00:00Z'),
  updatedAt: new Date('2026-09-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: IntegrationTest | null = makeTest()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeTest(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: IntegrationTest | null = makeTest()) => {
  const repo = makeRepo(item) as any;
  return { svc: new IntegrationTestsService(repo), repo };
};

describe('IntegrationTestsService', () => {

  describe('findOne', () => {
    it('통합 테스트 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('it-001');
      expect(r.deliverables).toHaveLength(4);
      expect(r.simulations).toHaveLength(2);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('PREPARING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '신규 통합 테스트',
      });
      expect(r.status).toBe(IntegrationTestStatus.PREPARING);
      expect(r.version).toBe(1);
      expect(r.deliverables).toEqual([]);
      expect(r.simulations).toEqual([]);
    });
  });

  describe('update', () => {
    it('버전 증가 + 내용 수정', async () => {
      const { svc } = build();
      const r = await svc.update('it-001', { title: '수정된 통합 테스트' });
      expect(r.version).toBe(2);
    });

    it('APPROVED 상태에서 수정 → BadRequest', async () => {
      const approved = makeTest({ status: IntegrationTestStatus.APPROVED });
      const { svc } = build(approved);
      await expect(svc.update('it-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('startSimulation', () => {
    it('preparing → in_simulation (모든 산출물 완료 + 시뮬레이션 있음)', async () => {
      const { svc } = build();
      const r = await svc.startSimulation('it-001');
      expect(r.status).toBe(IntegrationTestStatus.IN_SIMULATION);
    });

    it('preparing 아닌 상태 → BadRequest', async () => {
      const inSim = makeTest({ status: IntegrationTestStatus.IN_SIMULATION });
      const { svc } = build(inSim);
      await expect(svc.startSimulation('it-001')).rejects.toThrow(BadRequestException);
    });

    it('시뮬레이션 없으면 → BadRequest', async () => {
      const noSim = makeTest({ simulations: [] });
      const { svc } = build(noSim);
      await expect(svc.startSimulation('it-001')).rejects.toThrow(BadRequestException);
    });

    it('미완료 산출물 있으면 → BadRequest', async () => {
      const deliverablesWithIncomplete = [
        ...makeDeliverables().slice(0, 3),
        {
          teamName: '기획팀',
          deliverableType: 'quality_inspection' as const,
          deliverableId: 'qi-001',
          deliverableTitle: '품질 점검 (미완료)',
          isCompleted: false,
        },
      ];
      const incomplete = makeTest({ deliverables: deliverablesWithIncomplete });
      const { svc } = build(incomplete);
      await expect(svc.startSimulation('it-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('runSimulation', () => {
    const inSimState = makeTest({ status: IntegrationTestStatus.IN_SIMULATION });

    it('시뮬레이션 결과 기록 (전체 pass)', async () => {
      const { svc } = build(inSimState);
      const r = await svc.runSimulation('it-001', {
        simulatedBy: '통합테스트팀 김테스터',
        scenarioResults: [
          {
            scenarioId: 'sim-001',
            overallResult: 'pass',
            stepResults: [
              { stepNo: 1, result: 'pass', actualResult: '정상 작동' },
              { stepNo: 2, result: 'pass', actualResult: '정상 재생' },
              { stepNo: 3, result: 'pass', actualResult: '정상 반응' },
            ],
          },
          {
            scenarioId: 'sim-002',
            overallResult: 'pass',
          },
        ],
      });
      expect(r.simulationResult).toBe('pass');
      expect(r.isFullyPassed).toBe(true);
    });

    it('일부 fail → simulationResult: fail, isFullyPassed: false', async () => {
      const { svc } = build(inSimState);
      const r = await svc.runSimulation('it-001', {
        simulatedBy: '테스터',
        scenarioResults: [
          { scenarioId: 'sim-001', overallResult: 'pass' },
          { scenarioId: 'sim-002', overallResult: 'fail' },
        ],
      });
      expect(r.simulationResult).toBe('fail');
      expect(r.isFullyPassed).toBe(false);
    });

    it('partial 있을 경우 → simulationResult: partial', async () => {
      const { svc } = build(inSimState);
      const r = await svc.runSimulation('it-001', {
        simulatedBy: '테스터',
        scenarioResults: [
          { scenarioId: 'sim-001', overallResult: 'pass' },
          { scenarioId: 'sim-002', overallResult: 'partial' },
        ],
      });
      expect(r.simulationResult).toBe('partial');
      expect(r.isFullyPassed).toBe(false);
    });

    it('in_simulation 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // PREPARING
      await expect(svc.runSimulation('it-001', {
        simulatedBy: '테스터',
        scenarioResults: [],
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForReview', () => {
    it('in_simulation → in_review (모든 시뮬레이션 결과 입력 후)', async () => {
      const allDone = makeTest({
        status: IntegrationTestStatus.IN_SIMULATION,
        simulations: makeSimulations().map(s => ({ ...s, overallResult: 'pass' as const })),
      });
      const { svc } = build(allDone);
      const r = await svc.submitForReview('it-001');
      expect(r.status).toBe(IntegrationTestStatus.IN_REVIEW);
    });

    it('미완료 시뮬레이션 있으면 → BadRequest', async () => {
      const withPending = makeTest({
        status: IntegrationTestStatus.IN_SIMULATION,
        // simulations: one with result, one without
        simulations: [
          { ...makeSimulations()[0], overallResult: 'pass' },
          makeSimulations()[1],  // no overallResult
        ],
      });
      const { svc } = build(withPending);
      await expect(svc.submitForReview('it-001')).rejects.toThrow(BadRequestException);
    });

    it('in_simulation 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // PREPARING
      await expect(svc.submitForReview('it-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitToClient', () => {
    it('in_review → client_review', async () => {
      const inReview = makeTest({ status: IntegrationTestStatus.IN_REVIEW, operationIssues: [] });
      const { svc } = build(inReview);
      const r = await svc.submitToClient('it-001');
      expect(r.status).toBe(IntegrationTestStatus.CLIENT_REVIEW);
    });

    it('critical 이슈 미해결 → BadRequest', async () => {
      const criticalIssue: OperationIssue = {
        issueId: 'issue-001', severity: 'critical',
        category: '시스템 연동', description: '제어 시스템 연동 오류',
        status: 'open',
      };
      const inReviewWithCritical = makeTest({
        status: IntegrationTestStatus.IN_REVIEW,
        operationIssues: [criticalIssue],
      });
      const { svc } = build(inReviewWithCritical);
      await expect(svc.submitToClient('it-001')).rejects.toThrow(BadRequestException);
    });

    it('in_review 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // PREPARING
      await expect(svc.submitToClient('it-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve (컨펌 게이트 #4)', () => {
    const clientReview = makeTest({ status: IntegrationTestStatus.CLIENT_REVIEW });

    it('client_review → approved', async () => {
      const { svc } = build(clientReview);
      const r = await svc.approve('it-001', {
        approvedBy: '클라이언트 최승인',
        clientFeedback: '전체 품질 만족. Phase 5 착수 승인.',
      });
      expect(r.status).toBe(IntegrationTestStatus.APPROVED);
      expect(r.approvedBy).toBe('클라이언트 최승인');
      expect(r.approvedAt).toBeTruthy();
    });

    it('client_review 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // PREPARING
      await expect(svc.approve('it-001', { approvedBy: '클라이언트' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('반려 처리', async () => {
      const clientReview = makeTest({ status: IntegrationTestStatus.CLIENT_REVIEW });
      const { svc } = build(clientReview);
      const r = await svc.reject('it-001', '안전 기준 미달로 반려');
      expect(r.status).toBe(IntegrationTestStatus.REJECTED);
      expect(r.clientFeedback).toBe('안전 기준 미달로 반려');
    });
  });

  describe('remove', () => {
    it('PREPARING 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('it-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('APPROVED 상태 삭제 → BadRequest', async () => {
      const approved = makeTest({ status: IntegrationTestStatus.APPROVED });
      const { svc } = build(approved);
      await expect(svc.remove('it-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로 — 컨펌 게이트 #4', () => {
    it('preparing → in_simulation → in_review → client_review → approved (Phase 5 착수)', async () => {
      // Step 1: PREPARING → IN_SIMULATION
      const repo1 = makeRepo(makeTest()) as any;
      const svc1 = new IntegrationTestsService(repo1);
      const inSim = await svc1.startSimulation('it-001');
      expect(inSim.status).toBe(IntegrationTestStatus.IN_SIMULATION);

      // Step 2: IN_SIMULATION — runSimulation (pass)
      const inSimState = makeTest({ status: IntegrationTestStatus.IN_SIMULATION });
      const repo2 = makeRepo(inSimState) as any;
      const svc2 = new IntegrationTestsService(repo2);
      const afterRun = await svc2.runSimulation('it-001', {
        simulatedBy: '통합테스트팀',
        scenarioResults: [
          { scenarioId: 'sim-001', overallResult: 'pass' },
          { scenarioId: 'sim-002', overallResult: 'pass' },
        ],
      });
      expect(afterRun.simulationResult).toBe('pass');
      expect(afterRun.isFullyPassed).toBe(true);

      // Step 3: → IN_REVIEW
      const allSimsDone = makeTest({
        status: IntegrationTestStatus.IN_SIMULATION,
        simulations: makeSimulations().map(s => ({ ...s, overallResult: 'pass' as const })),
      });
      const repo3 = makeRepo(allSimsDone) as any;
      const svc3 = new IntegrationTestsService(repo3);
      const inReview = await svc3.submitForReview('it-001');
      expect(inReview.status).toBe(IntegrationTestStatus.IN_REVIEW);

      // Step 4: → CLIENT_REVIEW
      const inReviewState = makeTest({ status: IntegrationTestStatus.IN_REVIEW, operationIssues: [] });
      const repo4 = makeRepo(inReviewState) as any;
      const svc4 = new IntegrationTestsService(repo4);
      const clientReview = await svc4.submitToClient('it-001');
      expect(clientReview.status).toBe(IntegrationTestStatus.CLIENT_REVIEW);

      // Step 5: → APPROVED (게이트 #4 통과 → Phase 5 착수!)
      const clientReviewState = makeTest({ status: IntegrationTestStatus.CLIENT_REVIEW });
      const repo5 = makeRepo(clientReviewState) as any;
      const svc5 = new IntegrationTestsService(repo5);
      const approved = await svc5.approve('it-001', {
        approvedBy: '클라이언트 최승인',
        clientFeedback: '완벽한 구현 완료. Phase 5 운영 단계 착수 승인.',
      });
      expect(approved.status).toBe(IntegrationTestStatus.APPROVED);
      expect(approved.approvedBy).toBe('클라이언트 최승인');
      // Phase 5 착수 조건 충족!
    });
  });
});
