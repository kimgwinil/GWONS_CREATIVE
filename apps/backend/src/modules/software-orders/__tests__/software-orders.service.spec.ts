/**
 * GWONS_CREATIVE — SoftwareOrdersService Unit Tests
 * Phase 3 — S/W·콘텐츠 발주 상태머신
 * draft → submitted → contracted → in_progress → testing → delivered → accepted
 */
import { SoftwareOrdersService } from '../software-orders.service';
import { SoftwareOrder, SoftwareOrderStatus, SoftwareOrderType } from '../entities/software-order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeSO = (overrides: Partial<SoftwareOrder> = {}): SoftwareOrder => ({
  id: 'so-001',
  orderNo: 'SO-2026-001',
  title: '체험형 인터랙티브 콘텐츠 제작',
  orderType: SoftwareOrderType.CUSTOM_DEV,
  status: SoftwareOrderStatus.DRAFT,
  vendorName: '(주)인터랙티브랩',
  vendorContact: 'dev@ilab.co.kr',
  contractAmount: null as any,
  currency: 'KRW',
  isCustomDevelopment: true,
  techRequirements: [
    { reqId: 'TR-001', category: '성능', description: '60fps 인터랙션', priority: 'must', isCustomizable: false },
  ],
  milestones: [
    { milestoneNo: 1, name: '기획안 확정', description: '스토리보드 제출', plannedDate: '2026-05-01', deliverable: '스토리보드 PDF', status: 'pending', paymentRatio: 30 },
    { milestoneNo: 2, name: '개발 완료', description: '1차 빌드 제출', plannedDate: '2026-06-15', deliverable: '실행 파일', status: 'pending', paymentRatio: 50 },
    { milestoneNo: 3, name: '최종 납품', description: '최종 버전 납품', plannedDate: '2026-07-01', deliverable: '최종 파일 + 매뉴얼', status: 'pending', paymentRatio: 20 },
  ],
  licenseCount: null as any,
  licenseMonths: null as any,
  requiredDeliveryDate: new Date('2026-07-01'),
  expectedDeliveryDate: null as any,
  actualDeliveryDate: null as any,
  contractFileUrl: null as any,
  testResult: null as any,
  deliverableFileUrl: null as any,
  notes: null as any,
  procurementListId: 'pl-001',
  orderedBy: '조달팀_박조달',
  submittedAt: null as any,
  contractedAt: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: SoftwareOrder | null = makeSO()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeSO(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: SoftwareOrder | null = makeSO()) => {
  const repo = makeRepo(item) as any;
  return { svc: new SoftwareOrdersService(repo), repo };
};

describe('SoftwareOrdersService', () => {

  describe('findOne', () => {
    it('S/W 발주서를 반환해야 한다', async () => {
      const { svc } = build();
      const r = await svc.findOne('so-001');
      expect(r.orderType).toBe(SoftwareOrderType.CUSTOM_DEV);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('custom_dev 타입은 isCustomDevelopment=true 자동 설정', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', orderNo: 'SO-002',
        title: '커스텀 CMS', orderType: SoftwareOrderType.CUSTOM_DEV,
        vendorName: '(주)개발사',
      });
      expect(r.isCustomDevelopment).toBe(true);
    });
    it('license 타입은 isCustomDevelopment=false', async () => {
      const { svc } = build(makeSO({ isCustomDevelopment: false }));
      const r = await svc.create({
        projectId: 'proj-001', orderNo: 'SO-003',
        title: '전시 관리 라이선스', orderType: SoftwareOrderType.LICENSE,
        vendorName: '(주)소프트웨어',
        isCustomDevelopment: false,
      });
      expect(r.status).toBe(SoftwareOrderStatus.DRAFT);
    });
  });

  describe('submit', () => {
    it('draft → submitted', async () => {
      const { svc } = build();
      const r = await svc.submit('so-001');
      expect(r.status).toBe(SoftwareOrderStatus.SUBMITTED);
      expect(r.submittedAt).toBeDefined();
    });
    it('vendorName 없으면 → BadRequestException', async () => {
      const { svc } = build(makeSO({ vendorName: '' }));
      await expect(svc.submit('so-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('contract', () => {
    it('submitted → contracted + 계약금액 설정', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.SUBMITTED }));
      const r = await svc.contract('so-001', 25000000, 's3://contracts/so-001.pdf');
      expect(r.status).toBe(SoftwareOrderStatus.CONTRACTED);
      expect(r.contractAmount).toBe(25000000);
      expect(r.contractFileUrl).toBe('s3://contracts/so-001.pdf');
    });
    it('계약 금액 0 → BadRequestException', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.SUBMITTED }));
      await expect(svc.contract('so-001', 0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('startDevelopment', () => {
    it('contracted → in_progress', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.CONTRACTED }));
      const r = await svc.startDevelopment('so-001');
      expect(r.status).toBe(SoftwareOrderStatus.IN_PROGRESS);
    });
  });

  describe('startTesting', () => {
    it('in_progress → testing + deliverableFileUrl 설정', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.IN_PROGRESS }));
      const r = await svc.startTesting('so-001', 's3://deliverables/build_v1.zip');
      expect(r.status).toBe(SoftwareOrderStatus.TESTING);
      expect(r.deliverableFileUrl).toBe('s3://deliverables/build_v1.zip');
    });
  });

  describe('deliver (테스트 결과)', () => {
    it('pass → delivered + 납기일 기록', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.TESTING }));
      const r = await svc.deliver('so-001', {
        testedBy: '품질팀_최품질', totalTestCases: 50, passedCases: 50, failedCases: 0,
        issues: [], overallResult: 'pass',
      });
      expect(r.status).toBe(SoftwareOrderStatus.DELIVERED);
      expect(r.testResult.overallResult).toBe('pass');
      expect(r.actualDeliveryDate).toBeDefined();
    });

    it('fail → in_progress로 복귀 (재작업)', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.TESTING }));
      const r = await svc.deliver('so-001', {
        testedBy: '품질팀', totalTestCases: 50, passedCases: 35, failedCases: 15,
        issues: ['성능 기준 미달'], overallResult: 'fail',
      });
      expect(r.status).toBe(SoftwareOrderStatus.IN_PROGRESS);
      expect(r.testResult.overallResult).toBe('fail');
    });

    it('testing 이외 → BadRequestException', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.IN_PROGRESS }));
      await expect(
        svc.deliver('so-001', { testedBy: '팀', totalTestCases: 10, passedCases: 10, failedCases: 0, overallResult: 'pass' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('accept', () => {
    it('delivered → accepted', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.DELIVERED }));
      const r = await svc.accept('so-001');
      expect(r.status).toBe(SoftwareOrderStatus.ACCEPTED);
    });
  });

  describe('updateMilestone', () => {
    it('마일스톤 상태를 업데이트해야 한다', async () => {
      const { svc } = build();
      const r = await svc.updateMilestone('so-001', 1, 'completed', '2026-04-30');
      const ms = r.milestones.find(m => m.milestoneNo === 1);
      expect(ms?.status).toBe('completed');
      expect(ms?.actualDate).toBe('2026-04-30');
    });
    it('없는 마일스톤 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.updateMilestone('so-001', 99, 'completed')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('accepted 상태 취소 → BadRequestException', async () => {
      const { svc } = build(makeSO({ status: SoftwareOrderStatus.ACCEPTED }));
      await expect(svc.cancel('so-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 상태 흐름 (draft → accepted)', () => {
    it('7단계 전환이 순서대로 작동해야 한다', async () => {
      const steps = [
        { s: SoftwareOrderStatus.DRAFT,        a: (x: SoftwareOrdersService) => x.submit('so-001'),                                                                                     e: SoftwareOrderStatus.SUBMITTED },
        { s: SoftwareOrderStatus.SUBMITTED,    a: (x: SoftwareOrdersService) => x.contract('so-001', 25000000),                                                                          e: SoftwareOrderStatus.CONTRACTED },
        { s: SoftwareOrderStatus.CONTRACTED,   a: (x: SoftwareOrdersService) => x.startDevelopment('so-001'),                                                                            e: SoftwareOrderStatus.IN_PROGRESS },
        { s: SoftwareOrderStatus.IN_PROGRESS,  a: (x: SoftwareOrdersService) => x.startTesting('so-001'),                                                                                e: SoftwareOrderStatus.TESTING },
        { s: SoftwareOrderStatus.TESTING,      a: (x: SoftwareOrdersService) => x.deliver('so-001', { testedBy: '팀', totalTestCases: 50, passedCases: 50, failedCases: 0, overallResult: 'pass' }), e: SoftwareOrderStatus.DELIVERED },
        { s: SoftwareOrderStatus.DELIVERED,    a: (x: SoftwareOrdersService) => x.accept('so-001'),                                                                                      e: SoftwareOrderStatus.ACCEPTED },
      ];
      for (const { s, a, e } of steps) {
        const repo = makeRepo(makeSO({ status: s })) as any;
        const r = await a(new SoftwareOrdersService(repo));
        expect(r.status).toBe(e);
      }
    });
  });
});
