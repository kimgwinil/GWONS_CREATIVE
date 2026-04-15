/**
 * GWONS_CREATIVE — ProcurementListsService Unit Tests
 * Phase 3 착수 트리거: 조달 목록 확정 상태머신
 * drafting → in_review → approved → locked
 */
import { ProcurementListsService } from '../procurement-lists.service';
import { ProcurementList, ProcurementListStatus, ProcurementLineItem } from '../entities/procurement-list.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeLineItems = (): ProcurementLineItem[] => [
  { lineNo: 1, itemName: '인터랙티브 미디어 월', category: 'hardware', quantity: 2, unit: '세트',
    estimatedUnitPrice: 22500000, estimatedTotalPrice: 45000000, currency: 'KRW',
    vendorName: '(주)미디어테크', isCustom: true, priority: 'critical', leadTimeDays: 60 },
  { lineNo: 2, itemName: '전시 관리 S/W', category: 'software', quantity: 1, unit: '라이선스',
    estimatedUnitPrice: 8000000, estimatedTotalPrice: 8000000, currency: 'KRW',
    vendorName: '스마트전시솔루션', isCustom: false, priority: 'high', leadTimeDays: 30 },
  { lineNo: 3, itemName: '체험형 콘텐츠 제작', category: 'content', quantity: 5, unit: '편',
    estimatedUnitPrice: 3000000, estimatedTotalPrice: 15000000, currency: 'KRW',
    isCustom: true, priority: 'high', leadTimeDays: 45 },
];

const makeList = (overrides: Partial<ProcurementList> = {}): ProcurementList => ({
  id: 'pl-001',
  title: '전시관 A동 최종 조달 목록 v1',
  description: 'Phase 2 시장조사 기반 확정',
  status: ProcurementListStatus.DRAFTING,
  lineItems: makeLineItems(),
  budgetSummary: null as any,
  totalBudget: 68000000,
  contingencyRate: 10,
  version: 1,
  designReviewId: 'dr-001',
  approvedBy: null as any,
  approvedAt: null as any,
  approvalNotes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: ProcurementList | null = makeList()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeList(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: ProcurementList | null = makeList()) => {
  const repo = makeRepo(item) as any;
  return { svc: new ProcurementListsService(repo), repo };
};

describe('ProcurementListsService', () => {

  describe('findOne', () => {
    it('존재하는 조달 목록을 반환해야 한다', async () => {
      const { svc } = build();
      const r = await svc.findOne('pl-001');
      expect(r.title).toContain('최종 조달 목록');
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 조달 목록을 drafting 상태로 생성해야 한다', async () => {
      const { svc } = build();
      const r = await svc.create({ projectId: 'proj-001', title: '신규 조달 목록', lineItems: makeLineItems() });
      expect(r.status).toBe(ProcurementListStatus.DRAFTING);
      expect(r.contingencyRate).toBe(10);
    });
  });

  describe('submitForReview', () => {
    it('drafting → in_review 전환 + 예산 자동 계산', async () => {
      const { svc } = build();
      const r = await svc.submitForReview('pl-001');
      expect(r.status).toBe(ProcurementListStatus.IN_REVIEW);
      expect(r.budgetSummary).toBeDefined();
      expect(r.budgetSummary.hardware).toBe(45000000);
      expect(r.budgetSummary.software).toBe(8000000);
      expect(r.budgetSummary.content).toBe(15000000);
      expect(r.budgetSummary.totalEstimated).toBeGreaterThan(68000000); // 예비비 포함
    });

    it('lineItems 없으면 BadRequestException', async () => {
      const { svc } = build(makeList({ lineItems: [] }));
      await expect(svc.submitForReview('pl-001')).rejects.toThrow(BadRequestException);
    });

    it('drafting 이외 상태 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.IN_REVIEW }));
      await expect(svc.submitForReview('pl-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve (Phase 3 병렬 트리거)', () => {
    it('in_review → approved + 승인자 기록', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.IN_REVIEW, budgetSummary: {} as any }));
      const r = await svc.approve('pl-001', { approvedBy: '기획팀장', approvalNotes: '전체 승인' });
      expect(r.status).toBe(ProcurementListStatus.APPROVED);
      expect(r.approvedBy).toBe('기획팀장');
      expect(r.approvedAt).toBeDefined();
    });

    it('critical 항목 0개 → BadRequestException', async () => {
      const nocrits = makeLineItems().map(li => ({ ...li, priority: 'medium' as any }));
      const { svc } = build(makeList({ status: ProcurementListStatus.IN_REVIEW, lineItems: nocrits }));
      await expect(svc.approve('pl-001', { approvedBy: '팀장' })).rejects.toThrow(BadRequestException);
    });

    it('in_review 이외 상태 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.DRAFTING }));
      await expect(svc.approve('pl-001', { approvedBy: '팀장' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('lock', () => {
    it('approved → locked 전환', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.APPROVED }));
      const r = await svc.lock('pl-001');
      expect(r.status).toBe(ProcurementListStatus.LOCKED);
    });
    it('미승인 상태 잠금 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.IN_REVIEW }));
      await expect(svc.lock('pl-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('locked 상태 수정 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.LOCKED }));
      await expect(svc.update('pl-001', { title: '수정 시도' })).rejects.toThrow(BadRequestException);
    });
    it('approved 상태 수정 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.APPROVED }));
      await expect(svc.update('pl-001', { title: '수정 시도' })).rejects.toThrow(BadRequestException);
    });
    it('버전이 1 증가해야 한다', async () => {
      const { svc } = build(makeList({ version: 2 }));
      const r = await svc.update('pl-001', { title: '버전 업' });
      expect(r.version).toBe(3);
    });
  });

  describe('remove', () => {
    it('approved 상태 삭제 → BadRequestException', async () => {
      const { svc } = build(makeList({ status: ProcurementListStatus.APPROVED }));
      await expect(svc.remove('pl-001')).rejects.toThrow(BadRequestException);
    });
    it('drafting 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('pl-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('전체 상태 흐름', () => {
    it('drafting → in_review → approved → locked 정상 작동', async () => {
      const flow = [
        { status: ProcurementListStatus.DRAFTING,  action: (s: ProcurementListsService) => s.submitForReview('pl-001'),              expected: ProcurementListStatus.IN_REVIEW },
        { status: ProcurementListStatus.IN_REVIEW, action: (s: ProcurementListsService) => s.approve('pl-001', { approvedBy: '팀장' }), expected: ProcurementListStatus.APPROVED },
        { status: ProcurementListStatus.APPROVED,  action: (s: ProcurementListsService) => s.lock('pl-001'),                         expected: ProcurementListStatus.LOCKED },
      ];
      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makeList({ status })) as any;
        const r = await action(new ProcurementListsService(repo));
        expect(r.status).toBe(expected);
      }
    });
  });
});
