/**
 * GWONS_CREATIVE — OperationGuidesService Unit Tests
 * Phase 5 기획팀: 오픈 운영 가이드 전달
 * drafting → in_review → approved → delivered (→ revised)
 */
import { OperationGuidesService } from '../operation-guides.service';
import {
  OperationGuide, OperationGuideStatus, GuideCategory,
  OperationStep, EmergencyContact, OperatingSchedule,
} from '../entities/operation-guide.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeSteps = (): OperationStep[] => [
  { stepNo: 1, title: '개장 준비', description: '전시관 시스템 부팅 및 점검', responsible: '기술 운영팀', duration: '30분' },
  { stepNo: 2, title: '입장 준비', description: '키오스크 및 안내 데스크 준비', responsible: '운영팀', duration: '10분' },
  { stepNo: 3, title: '관람객 안내 시작', description: '입장 안내 및 티켓 발매 시작', responsible: '안내팀', duration: '상시' },
];

const makeContacts = (): EmergencyContact[] => [
  { role: '시설 관리', name: '김시설', phone: '010-1234-5678', availableHours: '24시간' },
  { role: '기술 지원', name: '이기술', phone: '010-9876-5432', availableHours: '09:00-18:00' },
];

const makeSchedule = (): OperatingSchedule[] => [
  { dayOfWeek: 'weekday', openTime: '10:00', closeTime: '18:00', staffCount: 5 },
  { dayOfWeek: 'saturday', openTime: '10:00', closeTime: '20:00', staffCount: 7 },
  { dayOfWeek: 'sunday', openTime: '10:00', closeTime: '17:00', staffCount: 6 },
];

const makeGuide = (overrides: Partial<OperationGuide> = {}): OperationGuide => ({
  id: 'og-001',
  title: '전시관 A동 일일 운영 가이드 v1',
  description: '개장부터 폐장까지의 일상 운영 절차',
  status: OperationGuideStatus.DRAFTING,
  category: GuideCategory.DAILY_OPERATION,
  steps: makeSteps(),
  emergencyContacts: makeContacts(),
  operatingSchedule: makeSchedule(),
  version: 1,
  documentUrl: null as any,
  author: '기획팀 박기획',
  approvedBy: null as any,
  approvedAt: null as any,
  deliveredTo: null as any,
  deliveredAt: null as any,
  validUntil: null as any,
  notes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-09-15T10:00:00Z'),
  updatedAt: new Date('2026-09-15T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: OperationGuide | null = makeGuide()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeGuide(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: OperationGuide | null = makeGuide()) => {
  const repo = makeRepo(item) as any;
  return { svc: new OperationGuidesService(repo), repo };
};

describe('OperationGuidesService', () => {

  describe('findOne', () => {
    it('운영 가이드 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('og-001');
      expect(r.category).toBe(GuideCategory.DAILY_OPERATION);
      expect(r.steps).toHaveLength(3);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('DRAFTING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '비상 대응 가이드',
        category: GuideCategory.EMERGENCY,
      });
      expect(r.status).toBe(OperationGuideStatus.DRAFTING);
      expect(r.version).toBe(1);
    });

    it('steps/contacts/schedule 기본값 빈 배열', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '신규 가이드',
        category: GuideCategory.TECHNICAL,
      });
      expect(r.steps).toEqual([]);
      expect(r.emergencyContacts).toEqual([]);
      expect(r.operatingSchedule).toEqual([]);
    });
  });

  describe('update', () => {
    it('DRAFTING 상태에서 제목 수정', async () => {
      const { svc } = build();
      const r = await svc.update('og-001', { title: '수정된 운영 가이드' });
      expect(r.title).toBe('수정된 운영 가이드');
    });

    it('DELIVERED 상태에서 수정 → BadRequest', async () => {
      const delivered = makeGuide({ status: OperationGuideStatus.DELIVERED });
      const { svc } = build(delivered);
      await expect(svc.update('og-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForReview', () => {
    it('drafting → in_review', async () => {
      const { svc } = build();
      const r = await svc.submitForReview('og-001');
      expect(r.status).toBe(OperationGuideStatus.IN_REVIEW);
    });

    it('steps 없으면 → BadRequest', async () => {
      const noSteps = makeGuide({ steps: [] });
      const { svc } = build(noSteps);
      await expect(svc.submitForReview('og-001')).rejects.toThrow(BadRequestException);
    });

    it('drafting/revised 아닌 상태 → BadRequest', async () => {
      const inReview = makeGuide({ status: OperationGuideStatus.IN_REVIEW });
      const { svc } = build(inReview);
      await expect(svc.submitForReview('og-001')).rejects.toThrow(BadRequestException);
    });

    it('revised 상태에서도 검토 요청 가능', async () => {
      const revised = makeGuide({ status: OperationGuideStatus.REVISED, steps: makeSteps() });
      const { svc } = build(revised);
      const r = await svc.submitForReview('og-001');
      expect(r.status).toBe(OperationGuideStatus.IN_REVIEW);
    });
  });

  describe('approve', () => {
    it('in_review → approved', async () => {
      const inReview = makeGuide({ status: OperationGuideStatus.IN_REVIEW });
      const { svc } = build(inReview);
      const r = await svc.approve('og-001', { approvedBy: '팀장 김승인' });
      expect(r.status).toBe(OperationGuideStatus.APPROVED);
      expect(r.approvedBy).toBe('팀장 김승인');
      expect(r.approvedAt).toBeTruthy();
    });

    it('in_review 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.approve('og-001', { approvedBy: '팀장' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deliver', () => {
    it('approved → delivered', async () => {
      const approved = makeGuide({ status: OperationGuideStatus.APPROVED });
      const { svc } = build(approved);
      const r = await svc.deliver('og-001', { deliveredTo: '현장 운영팀장 이현장' });
      expect(r.status).toBe(OperationGuideStatus.DELIVERED);
      expect(r.deliveredTo).toBe('현장 운영팀장 이현장');
      expect(r.deliveredAt).toBeTruthy();
    });

    it('approved 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.deliver('og-001', { deliveredTo: '현장팀' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('revise', () => {
    it('delivered → revised (버전 증가)', async () => {
      const delivered = makeGuide({ status: OperationGuideStatus.DELIVERED, version: 1 });
      const { svc } = build(delivered);
      const r = await svc.revise('og-001');
      expect(r.status).toBe(OperationGuideStatus.REVISED);
      expect(r.version).toBe(2);
    });

    it('delivered 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.revise('og-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('DRAFTING 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('og-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('APPROVED 상태 삭제 → BadRequest', async () => {
      const approved = makeGuide({ status: OperationGuideStatus.APPROVED });
      const { svc } = build(approved);
      await expect(svc.remove('og-001')).rejects.toThrow(BadRequestException);
    });

    it('DELIVERED 상태 삭제 → BadRequest', async () => {
      const delivered = makeGuide({ status: OperationGuideStatus.DELIVERED });
      const { svc } = build(delivered);
      await expect(svc.remove('og-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로', () => {
    it('drafting → in_review → approved → delivered → revised → in_review → approved → delivered', async () => {
      // 1. DRAFTING → IN_REVIEW
      const repo1 = makeRepo(makeGuide()) as any;
      const svc1 = new OperationGuidesService(repo1);
      const inReview = await svc1.submitForReview('og-001');
      expect(inReview.status).toBe(OperationGuideStatus.IN_REVIEW);

      // 2. → APPROVED
      const inReviewState = makeGuide({ status: OperationGuideStatus.IN_REVIEW });
      const repo2 = makeRepo(inReviewState) as any;
      const svc2 = new OperationGuidesService(repo2);
      const approved = await svc2.approve('og-001', { approvedBy: '팀장 김승인' });
      expect(approved.status).toBe(OperationGuideStatus.APPROVED);

      // 3. → DELIVERED
      const approvedState = makeGuide({ status: OperationGuideStatus.APPROVED });
      const repo3 = makeRepo(approvedState) as any;
      const svc3 = new OperationGuidesService(repo3);
      const delivered = await svc3.deliver('og-001', { deliveredTo: '현장 운영팀' });
      expect(delivered.status).toBe(OperationGuideStatus.DELIVERED);

      // 4. → REVISED (개정)
      const deliveredState = makeGuide({ status: OperationGuideStatus.DELIVERED, version: 1 });
      const repo4 = makeRepo(deliveredState) as any;
      const svc4 = new OperationGuidesService(repo4);
      const revised = await svc4.revise('og-001');
      expect(revised.status).toBe(OperationGuideStatus.REVISED);
      expect(revised.version).toBe(2);
    });

    it('카테고리별 가이드 생성 — 전체 카테고리', async () => {
      const categories = Object.values(GuideCategory);
      expect(categories).toHaveLength(6);
      for (const cat of categories) {
        const { svc } = build();
        const r = await svc.create({ projectId: 'proj-001', title: `${cat} 가이드`, category: cat });
        expect(r.status).toBe(OperationGuideStatus.DRAFTING);
      }
    });
  });
});
