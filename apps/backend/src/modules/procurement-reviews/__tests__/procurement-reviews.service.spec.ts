/**
 * GWONS_CREATIVE — ProcurementReviewsService Unit Tests
 * Phase 3 컨펌 게이트 #3: 조달 통합 검토서 상태머신
 * collecting → in_review → budget_check → client_review → approved
 */
import { ProcurementReviewsService } from '../procurement-reviews.service';
import {
  ProcurementReview,
  ProcurementReviewStatus,
  Phase3Deliverable,
  BudgetComparison,
  ProcurementIssue,
} from '../entities/procurement-review.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeDeliverables = (
  allCompleted = true,
): Phase3Deliverable[] => [
  {
    teamName: '기획팀',
    deliverableType: 'procurement_list',
    deliverableId: 'pl-001',
    deliverableTitle: '최종 조달 목록 v1',
    isCompleted: allCompleted,
    amount: 68000000,
    completedAt: allCompleted ? '2026-04-14T10:00:00Z' : undefined,
  },
  {
    teamName: '조달팀(H/W)',
    deliverableType: 'purchase_order',
    deliverableId: 'po-001',
    deliverableTitle: '인터랙티브 디스플레이 발주서',
    isCompleted: allCompleted,
    amount: 45000000,
    completedAt: allCompleted ? '2026-04-15T10:00:00Z' : undefined,
  },
  {
    teamName: '조달팀(S/W)',
    deliverableType: 'software_order',
    deliverableId: 'so-001',
    deliverableTitle: '전시관리 S/W 발주서',
    isCompleted: allCompleted,
    amount: 8000000,
    completedAt: allCompleted ? '2026-04-15T11:00:00Z' : undefined,
  },
  {
    teamName: '기획+조달팀',
    deliverableType: 'delivery_schedule',
    deliverableId: 'ds-001',
    deliverableTitle: '통합 납품 일정표',
    isCompleted: allCompleted,
    completedAt: allCompleted ? '2026-04-16T09:00:00Z' : undefined,
  },
];

const makeBudgetComparisons = (): BudgetComparison[] => [
  {
    category: 'hardware',
    budgeted: 50000000,
    actual: 45000000,
    variance: -5000000,
    varianceRate: -10,
    withinBudget: true,
  },
  {
    category: 'software',
    budgeted: 10000000,
    actual: 8000000,
    variance: -2000000,
    varianceRate: -20,
    withinBudget: true,
  },
];

const makeProcurementIssues = (
  severity: 'critical' | 'major' | 'minor' = 'major',
  status: 'open' | 'resolved' = 'resolved',
): ProcurementIssue[] => [
  {
    id: 'issue-001',
    severity,
    category: 'delay',
    description: '센서 모듈 납품 2주 지연',
    impact: '설치 일정 조정 필요',
    resolution: status === 'resolved' ? '대체 공급사 선정 완료' : undefined,
    status,
    resolvedAt: status === 'resolved' ? '2026-04-20T10:00:00Z' : undefined,
  },
];

const makeReview = (
  overrides: Partial<ProcurementReview> = {},
): ProcurementReview => ({
  id: 'pr-001',
  title: 'Phase 3 조달 통합 검토서 v1',
  executiveSummary: '전시관 A동 전체 조달 결과 통합 검토',
  status: ProcurementReviewStatus.COLLECTING,
  deliverables: makeDeliverables(),
  budgetComparisons: makeBudgetComparisons(),
  procurementIssues: makeProcurementIssues(),
  totalProcurementAmount: 53000000,
  budgetVariance: -7000000,
  isWithinBudget: true,
  internalNotes: '전체 예산 초과 없음',
  clientFeedback: null as any,
  approvedBy: null as any,
  approvedAt: null as any,
  version: 1,
  procurementListId: 'pl-001',
  deliveryScheduleId: 'ds-001',
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: ProcurementReview | null = makeReview()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find: jest.fn().mockResolvedValue(item ? [item] : []),
  count: jest.fn().mockResolvedValue(1),
  create: jest
    .fn()
    .mockImplementation((d: any) => ({ ...makeReview(), ...d })),
  save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove: jest.fn().mockResolvedValue(undefined),
});

const build = (item: ProcurementReview | null = makeReview()) => {
  const repo = makeRepo(item) as any;
  return { svc: new ProcurementReviewsService(repo), repo };
};

describe('ProcurementReviewsService', () => {
  // ─────────────────────────────────────────────────────────
  // CRUD 기본
  // ─────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 검토서를 반환해야 한다', async () => {
      const { svc } = build();
      const r = await svc.findOne('pr-001');
      expect(r.title).toContain('조달 통합 검토서');
    });

    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 검토서를 COLLECTING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '신규 조달 검토서',
        totalProcurementAmount: 60000000,
      });
      expect(r.status).toBe(ProcurementReviewStatus.COLLECTING);
      expect(r.deliverables).toEqual([]);
      expect(r.version).toBe(1);
    });

    it('생성 시 procurementIssues, budgetComparisons 빈 배열로 초기화', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '초기 검토서',
      });
      expect(r.deliverables).toEqual([]);
      expect(r.budgetComparisons).toEqual([]);
      expect(r.procurementIssues).toEqual([]);
    });
  });

  describe('update', () => {
    it('산출물 및 예산 비교 업데이트', async () => {
      const { svc } = build();
      const r = await svc.update('pr-001', {
        budgetComparisons: makeBudgetComparisons(),
        internalNotes: '예산 검토 완료',
      });
      expect(r.internalNotes).toBe('예산 검토 완료');
      expect(r.version).toBe(2);
    });

    it('승인(APPROVED) 상태 수정 → BadRequestException', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.APPROVED }),
      );
      await expect(
        svc.update('pr-001', { title: '수정 시도' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('버전이 1 증가해야 한다', async () => {
      const { svc } = build(makeReview({ version: 3 }));
      const r = await svc.update('pr-001', { internalNotes: '버전업' });
      expect(r.version).toBe(4);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 상태 전환: submitForReview
  // ─────────────────────────────────────────────────────────
  describe('submitForReview', () => {
    it('collecting → in_review (모든 산출물 완료)', async () => {
      const { svc } = build();
      const r = await svc.submitForReview('pr-001');
      expect(r.status).toBe(ProcurementReviewStatus.IN_REVIEW);
    });

    it('미완료 산출물 있으면 BadRequestException', async () => {
      const { svc } = build(
        makeReview({ deliverables: makeDeliverables(false) }),
      );
      await expect(svc.submitForReview('pr-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('collecting 이외 상태 → BadRequestException', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.IN_REVIEW }),
      );
      await expect(svc.submitForReview('pr-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // 상태 전환: proceedToBudgetCheck
  // ─────────────────────────────────────────────────────────
  describe('proceedToBudgetCheck', () => {
    it('in_review → budget_check (critical 이슈 없음)', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.IN_REVIEW }),
      );
      const r = await svc.proceedToBudgetCheck('pr-001');
      expect(r.status).toBe(ProcurementReviewStatus.BUDGET_CHECK);
    });

    it('open critical 이슈 있으면 BadRequestException', async () => {
      const { svc } = build(
        makeReview({
          status: ProcurementReviewStatus.IN_REVIEW,
          procurementIssues: makeProcurementIssues('critical', 'open'),
        }),
      );
      await expect(svc.proceedToBudgetCheck('pr-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('open major 이슈는 차단하지 않아야 한다', async () => {
      const { svc } = build(
        makeReview({
          status: ProcurementReviewStatus.IN_REVIEW,
          procurementIssues: makeProcurementIssues('major', 'open'),
        }),
      );
      const r = await svc.proceedToBudgetCheck('pr-001');
      expect(r.status).toBe(ProcurementReviewStatus.BUDGET_CHECK);
    });

    it('in_review 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.proceedToBudgetCheck('pr-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // 상태 전환: submitToClient
  // ─────────────────────────────────────────────────────────
  describe('submitToClient', () => {
    it('budget_check → client_review 전환', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.BUDGET_CHECK }),
      );
      const r = await svc.submitToClient('pr-001');
      expect(r.status).toBe(ProcurementReviewStatus.CLIENT_REVIEW);
    });

    it('budget_check 이외 상태 → BadRequestException', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.IN_REVIEW }),
      );
      await expect(svc.submitToClient('pr-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // 컨펌 게이트 #3: approve
  // ─────────────────────────────────────────────────────────
  describe('approve (컨펌 게이트 #3 — Phase 4 착수)', () => {
    it('client_review → approved + 승인자 기록', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.CLIENT_REVIEW }),
      );
      const r = await svc.approve('pr-001', {
        approvedBy: '클라이언트 대표이사',
        clientFeedback: '조달 계획 전체 승인. Phase 4 착수 요망.',
      });
      expect(r.status).toBe(ProcurementReviewStatus.APPROVED);
      expect(r.approvedBy).toBe('클라이언트 대표이사');
      expect(r.approvedAt).toBeDefined();
      expect(r.clientFeedback).toContain('Phase 4 착수 요망');
    });

    it('client_review 이외 상태 → BadRequestException', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.BUDGET_CHECK }),
      );
      await expect(
        svc.approve('pr-001', { approvedBy: '클라이언트' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('피드백 없이도 승인 가능', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.CLIENT_REVIEW }),
      );
      const r = await svc.approve('pr-001', {
        approvedBy: '클라이언트 담당자',
      });
      expect(r.status).toBe(ProcurementReviewStatus.APPROVED);
      expect(r.approvedBy).toBe('클라이언트 담당자');
    });
  });

  // ─────────────────────────────────────────────────────────
  // 반려
  // ─────────────────────────────────────────────────────────
  describe('reject', () => {
    it('현재 상태에서 반려 처리 가능', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.CLIENT_REVIEW }),
      );
      const r = await svc.reject(
        'pr-001',
        '예산 초과로 인한 재검토 요청. 하드웨어 항목 20% 삭감 필요.',
      );
      expect(r.status).toBe(ProcurementReviewStatus.REJECTED);
      expect(r.clientFeedback).toContain('재검토 요청');
    });

    it('in_review 상태에서도 반려 가능', async () => {
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.IN_REVIEW }),
      );
      const r = await svc.reject('pr-001', '조달 목록 재검토 요청');
      expect(r.status).toBe(ProcurementReviewStatus.REJECTED);
    });
  });

  describe('remove', () => {
    it('검토서 삭제 정상 처리', async () => {
      const { svc, repo } = build();
      await svc.remove('pr-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 통합 흐름: 컨펌 게이트 #3 전체 패스
  // ─────────────────────────────────────────────────────────
  describe('전체 상태 흐름 — 컨펌 게이트 #3', () => {
    it('collecting → in_review → budget_check → client_review → approved', async () => {
      const flow: Array<{
        status: ProcurementReviewStatus;
        action: (svc: ProcurementReviewsService) => Promise<ProcurementReview>;
        expected: ProcurementReviewStatus;
      }> = [
        {
          status: ProcurementReviewStatus.COLLECTING,
          action: (s) => s.submitForReview('pr-001'),
          expected: ProcurementReviewStatus.IN_REVIEW,
        },
        {
          status: ProcurementReviewStatus.IN_REVIEW,
          action: (s) => s.proceedToBudgetCheck('pr-001'),
          expected: ProcurementReviewStatus.BUDGET_CHECK,
        },
        {
          status: ProcurementReviewStatus.BUDGET_CHECK,
          action: (s) => s.submitToClient('pr-001'),
          expected: ProcurementReviewStatus.CLIENT_REVIEW,
        },
        {
          status: ProcurementReviewStatus.CLIENT_REVIEW,
          action: (s) =>
            s.approve('pr-001', { approvedBy: '클라이언트', clientFeedback: '승인' }),
          expected: ProcurementReviewStatus.APPROVED,
        },
      ];

      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makeReview({ status })) as any;
        const r = await action(new ProcurementReviewsService(repo));
        expect(r.status).toBe(expected);
      }
    });

    it('반려 후 재검토를 위해 collecting 복구 가능 (reject → 다시 수집 후 재진행)', async () => {
      // reject는 status를 REJECTED로만 변경 — 재시작은 서비스 정책에 따라 별도 처리
      const { svc } = build(
        makeReview({ status: ProcurementReviewStatus.CLIENT_REVIEW }),
      );
      const r = await svc.reject('pr-001', '재검토 요청');
      expect(r.status).toBe(ProcurementReviewStatus.REJECTED);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 예산 검증 시나리오
  // ─────────────────────────────────────────────────────────
  describe('예산 비교 시나리오', () => {
    it('예산 초과 상태에서도 검토서 생성 가능', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '예산 초과 검토서',
        totalProcurementAmount: 120000000,
        budgetVariance: 20000000,
      });
      expect(r).toBeDefined();
    });

    it('예산 내 검토서 승인 흐름 정상 작동', async () => {
      const withinBudgetReview = makeReview({
        status: ProcurementReviewStatus.CLIENT_REVIEW,
        isWithinBudget: true,
        totalProcurementAmount: 53000000,
        budgetVariance: -7000000,
      });
      const { svc } = build(withinBudgetReview);
      const r = await svc.approve('pr-001', {
        approvedBy: '클라이언트',
        clientFeedback: '예산 절감 우수. 최종 승인.',
      });
      expect(r.status).toBe(ProcurementReviewStatus.APPROVED);
    });
  });
});
