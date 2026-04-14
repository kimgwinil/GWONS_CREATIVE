/**
 * GWONS_CREATIVE — DesignReviewsService Unit Tests
 * Phase 2 합류 모듈: 기본설계서 + 상세설계서 + 3D렌더 + CAD도면 + 시장조사 통합 검토
 * 컨펌 게이트 #2 상태머신 검증
 */
import { DesignReviewsService } from '../design-reviews.service';
import { DesignReview, DesignReviewStatus } from '../entities/design-review.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── 모킹 헬퍼 ────────────────────────────────────────────────
const makeReview = (overrides: Partial<DesignReview> = {}): DesignReview => ({
  id: 'dr-001',
  title: '1차 설계 통합 검토서',
  executiveSummary: '전시관 A동 Phase 2 통합 검토',
  status: DesignReviewStatus.COLLECTING,
  deliverables: [
    { teamName: '기획팀',     deliverableType: 'basic_design',    deliverableId: 'bd-01', deliverableTitle: '기본설계서',   isCompleted: true },
    { teamName: '기획팀',     deliverableType: 'detail_design',   deliverableId: 'dd-01', deliverableTitle: '상세설계서',   isCompleted: true },
    { teamName: '3D디자인팀', deliverableType: 'render_asset',    deliverableId: 'ra-01', deliverableTitle: '3D 렌더링',    isCompleted: true },
    { teamName: '2D디자인팀', deliverableType: 'cad_drawing',     deliverableId: 'cd-01', deliverableTitle: 'CAD 도면',     isCompleted: true },
    { teamName: '조달팀',     deliverableType: 'market_research', deliverableId: 'mr-01', deliverableTitle: '시장조사 결과', isCompleted: true },
  ],
  designIssues: [],
  basicDesignId: 'bd-01',
  detailDesignId: 'dd-01',
  renderAssetId: 'ra-01',
  cadDrawingId: 'cd-01',
  marketResearchId: 'mr-01',
  version: 1,
  clientFeedback: null as any,
  internalNotes: null as any,
  approvedBy: null as any,
  approvedAt: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: DesignReview | null = makeReview()) => ({
  findOne:  jest.fn().mockResolvedValue(item),
  find:     jest.fn().mockResolvedValue(item ? [item] : []),
  count:    jest.fn().mockResolvedValue(1),
  create:   jest.fn().mockImplementation((d: any) => ({ ...makeReview(), ...d })),
  save:     jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:   jest.fn().mockResolvedValue(undefined),
});

// DesignReviewsService 직접 인스턴스화 (NestJS DI 불필요)
const buildService = (item: DesignReview | null = makeReview()) => {
  const repo = makeRepo(item) as any;
  const svc  = new DesignReviewsService(repo);
  return { svc, repo };
};

// ── 테스트 스위트 ────────────────────────────────────────────
describe('DesignReviewsService', () => {

  // ── findOne ─────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 ID로 검토서를 반환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.findOne('dr-001');
      expect(result.id).toBe('dr-001');
      expect(result.title).toBe('1차 설계 통합 검토서');
    });

    it('존재하지 않는 ID는 NotFoundException을 던져야 한다', async () => {
      const { svc } = buildService(null);
      await expect(svc.findOne('not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────────────────
  describe('create', () => {
    it('새 검토서를 생성해야 한다 (초기 상태: collecting)', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        title: '신규 검토서',
        basicDesignId: 'bd-01',
        detailDesignId: 'dd-01',
        renderAssetId: 'ra-01',
        cadDrawingId: 'cd-01',
        marketResearchId: 'mr-01',
      });
      expect(result.status).toBe(DesignReviewStatus.COLLECTING);
    });

    it('산출물 체크리스트 5개가 자동 생성되어야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        title: '체크리스트 검증',
        basicDesignId: 'bd-01',
      });
      expect(result.deliverables).toHaveLength(5);
      const types = result.deliverables.map((d: any) => d.deliverableType);
      expect(types).toContain('basic_design');
      expect(types).toContain('detail_design');
      expect(types).toContain('render_asset');
      expect(types).toContain('cad_drawing');
      expect(types).toContain('market_research');
    });
  });

  // ── submitForReview ───────────────────────────────────────
  describe('submitForReview', () => {
    it('수집 중 → 검토 중으로 전환해야 한다 (모든 산출물 완료 시)', async () => {
      const { svc } = buildService();
      const result = await svc.submitForReview('dr-001');
      expect(result.status).toBe(DesignReviewStatus.IN_REVIEW);
    });

    it('미완료 산출물이 있으면 BadRequestException을 던져야 한다', async () => {
      const review = makeReview({
        deliverables: [
          { teamName: '기획팀', deliverableType: 'basic_design', deliverableId: '', deliverableTitle: '기본설계서', isCompleted: false },
          { teamName: '기획팀', deliverableType: 'detail_design', deliverableId: 'dd-01', deliverableTitle: '상세설계서', isCompleted: true },
          { teamName: '3D디자인팀', deliverableType: 'render_asset', deliverableId: 'ra-01', deliverableTitle: '3D 렌더링', isCompleted: true },
          { teamName: '2D디자인팀', deliverableType: 'cad_drawing', deliverableId: 'cd-01', deliverableTitle: 'CAD 도면', isCompleted: true },
          { teamName: '조달팀', deliverableType: 'market_research', deliverableId: 'mr-01', deliverableTitle: '시장조사 결과', isCompleted: true },
        ],
      });
      const { svc } = buildService(review);
      await expect(svc.submitForReview('dr-001')).rejects.toThrow(BadRequestException);
    });

    it('이미 검토 중 상태에서 재요청하면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.IN_REVIEW }));
      await expect(svc.submitForReview('dr-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ── submitToClient ────────────────────────────────────────
  describe('submitToClient', () => {
    it('내부 검토 중 → 클라이언트 검토로 전환해야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.IN_REVIEW }));
      const result = await svc.submitToClient('dr-001');
      expect(result.status).toBe(DesignReviewStatus.CLIENT_REVIEW);
    });

    it('Critical 이슈가 열려 있으면 클라이언트 제출을 막아야 한다', async () => {
      const review = makeReview({
        status: DesignReviewStatus.IN_REVIEW,
        designIssues: [{
          id: 'iss-01', severity: 'critical', category: '구조',
          description: '내력벽 오류', assignedTo: '2D팀',
          status: 'open',
        }],
      });
      const { svc } = buildService(review);
      await expect(svc.submitToClient('dr-001')).rejects.toThrow(BadRequestException);
    });

    it('수집 중 상태에서 클라이언트 제출은 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.COLLECTING }));
      await expect(svc.submitToClient('dr-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ── approve (컨펌 게이트 #2) ──────────────────────────────
  describe('approve — 컨펌 게이트 #2', () => {
    it('클라이언트 검토 → 승인(Gate #2 통과)으로 전환해야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.CLIENT_REVIEW }));
      const result = await svc.approve('dr-001', {
        approvedBy: '클라이언트 담당자',
        clientFeedback: '모든 설계 승인',
      });
      expect(result.status).toBe(DesignReviewStatus.APPROVED);
      expect(result.approvedBy).toBe('클라이언트 담당자');
      expect(result.approvedAt).toBeDefined();
    });

    it('클라이언트 검토 이전 상태에서 승인 시 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.IN_REVIEW }));
      await expect(
        svc.approve('dr-001', { approvedBy: '담당자' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── reject ───────────────────────────────────────────────
  describe('reject', () => {
    it('클라이언트 피드백과 함께 반려 처리해야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.CLIENT_REVIEW }));
      const result = await svc.reject('dr-001', '3D 렌더링 스타일 재검토 필요');
      expect(result.status).toBe(DesignReviewStatus.REJECTED);
      expect(result.clientFeedback).toBe('3D 렌더링 스타일 재검토 필요');
    });
  });

  // ── update (불변성 검증) ──────────────────────────────────
  describe('update', () => {
    it('승인된 검토서는 수정 불가해야 한다', async () => {
      const { svc } = buildService(makeReview({ status: DesignReviewStatus.APPROVED }));
      await expect(
        svc.update('dr-001', { internalNotes: '수정 시도' })
      ).rejects.toThrow(BadRequestException);
    });

    it('버전이 1 증가해야 한다', async () => {
      const { svc } = buildService(makeReview({ version: 2 }));
      const result = await svc.update('dr-001', { internalNotes: '메모 추가' });
      expect(result.version).toBe(3);
    });
  });

  // ── remove ───────────────────────────────────────────────
  describe('remove', () => {
    it('검토서를 삭제할 수 있어야 한다', async () => {
      const { svc, repo } = buildService();
      await svc.remove('dr-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  // ── 상태 전환 흐름 전체 검증 ──────────────────────────────
  describe('전체 상태 머신 흐름', () => {
    it('collecting → in_review → client_review → approved 순서가 정상 작동해야 한다', async () => {
      // 1단계: collecting → in_review
      const repo1 = makeRepo(makeReview({ status: DesignReviewStatus.COLLECTING })) as any;
      const svc1  = new DesignReviewsService(repo1);
      const step1 = await svc1.submitForReview('dr-001');
      expect(step1.status).toBe(DesignReviewStatus.IN_REVIEW);

      // 2단계: in_review → client_review
      const repo2 = makeRepo(makeReview({ status: DesignReviewStatus.IN_REVIEW })) as any;
      const svc2  = new DesignReviewsService(repo2);
      const step2 = await svc2.submitToClient('dr-001');
      expect(step2.status).toBe(DesignReviewStatus.CLIENT_REVIEW);

      // 3단계: client_review → approved (Gate #2)
      const repo3 = makeRepo(makeReview({ status: DesignReviewStatus.CLIENT_REVIEW })) as any;
      const svc3  = new DesignReviewsService(repo3);
      const step3 = await svc3.approve('dr-001', { approvedBy: '최종 승인자' });
      expect(step3.status).toBe(DesignReviewStatus.APPROVED);
    });
  });
});
