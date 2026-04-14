/**
 * GWONS_CREATIVE — MarketResearchesService Unit Tests
 * Phase 2 — 조달팀: 시장조사 상태머신 검증
 * open → completed → reviewed → approved
 */
import { MarketResearchesService } from '../market-researches.service';
import { MarketResearch, ResearchStatus, ResearchCategory } from '../entities/market-research.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── 모킹 헬퍼 ────────────────────────────────────────────────
const makeResearch = (overrides: Partial<MarketResearch> = {}): MarketResearch => ({
  id: 'mr-001',
  itemName: '인터랙티브 미디어 월 시스템',
  description: '터치 인터랙티브 미디어 파사드 시스템 (4K, 5m × 3m)',
  category: ResearchCategory.DISPLAY,
  status: ResearchStatus.OPEN,
  quantity: 2,
  unit: '세트',
  vendorQuotes: [
    {
      vendorName: '(주)미디어테크',
      vendorContact: 'sales@mediatech.co.kr',
      unitPrice: 22500000,
      totalPrice: 45000000,
      currency: 'KRW' as const,
      leadTimeDays: 60,
      warrantyMonths: 24,
      isCustomizable: true,
      quotedAt: '2026-04-14T10:00:00Z',
    },
    {
      vendorName: '글로벌AV코리아',
      vendorContact: 'bid@globalav.kr',
      unitPrice: 19000000,
      totalPrice: 38000000,
      currency: 'KRW' as const,
      leadTimeDays: 75,
      warrantyMonths: 12,
      isCustomizable: false,
      quotedAt: '2026-04-14T10:00:00Z',
    },
  ],
  techSpecs: [
    { specName: '해상도', required: '필수', vendorValues: { '(주)미디어테크': '4K UHD', '글로벌AV코리아': '4K UHD' } },
    { specName: '터치 포인트', required: '필수', vendorValues: { '(주)미디어테크': '40포인트', '글로벌AV코리아': '20포인트' } },
    { specName: '밝기', required: '권장', vendorValues: { '(주)미디어테크': '800nit', '글로벌AV코리아': '650nit' } },
  ],
  recommendedVendor: '(주)미디어테크',
  recommendationReason: '커스터마이징 가능 + 기술 지원 우수',
  isCustomizable: true,
  customizationSpec: '전시 테마 맞춤 프레임 설계',
  estimatedMinPrice: 38000000,
  estimatedMaxPrice: 45000000,
  researchedBy: '조달팀_김조달',
  procurementItemId: null as any,
  contentSpecRef: 'CONTENT-AV-001',
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: MarketResearch | null = makeResearch()) => ({
  findOne:  jest.fn().mockResolvedValue(item),
  find:     jest.fn().mockResolvedValue(item ? [item] : []),
  count:    jest.fn().mockResolvedValue(1),
  create:   jest.fn().mockImplementation((d: any) => ({ ...makeResearch(), ...d })),
  save:     jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:   jest.fn().mockResolvedValue(undefined),
});

const buildService = (item: MarketResearch | null = makeResearch()) => {
  const repo = makeRepo(item) as any;
  const svc  = new MarketResearchesService(repo);
  return { svc, repo };
};

// ── 테스트 스위트 ────────────────────────────────────────────
describe('MarketResearchesService', () => {

  describe('findOne', () => {
    it('존재하는 시장조사를 반환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.findOne('mr-001');
      expect(result.id).toBe('mr-001');
      expect(result.category).toBe(ResearchCategory.DISPLAY);
    });

    it('존재하지 않으면 NotFoundException을 던져야 한다', async () => {
      const { svc } = buildService(null);
      await expect(svc.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 시장조사를 생성해야 한다 (초기 상태: open)', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        itemName: 'LED 조명 시스템',
        category: ResearchCategory.LIGHTING_HW,
        quantity: 10,
        unit: '세트',
      });
      expect(result.status).toBe(ResearchStatus.OPEN);
    });

    it('vendorQuotes 미전달 시 빈 배열로 초기화해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        itemName: '스피커 시스템',
        category: ResearchCategory.AUDIO,
        quantity: 4,
      });
      expect(result.vendorQuotes).toEqual([]);
    });
  });

  describe('complete', () => {
    it('open → completed로 전환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.complete('mr-001');
      expect(result.status).toBe(ResearchStatus.COMPLETED);
    });

    it('open 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.COMPLETED }));
      await expect(svc.complete('mr-001')).rejects.toThrow(BadRequestException);
    });

    it('견적(vendorQuotes)이 없으면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeResearch({ vendorQuotes: [] }));
      await expect(svc.complete('mr-001')).rejects.toThrow(BadRequestException);
    });

    it('추천 공급처(recommendedVendor)가 없으면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeResearch({ recommendedVendor: null as any }));
      await expect(svc.complete('mr-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('review', () => {
    it('completed → reviewed로 전환해야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.COMPLETED }));
      const result = await svc.review('mr-001');
      expect(result.status).toBe(ResearchStatus.REVIEWED);
    });

    it('completed 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.OPEN }));
      await expect(svc.review('mr-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('reviewed → approved로 전환해야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.REVIEWED }));
      const result = await svc.approve('mr-001');
      expect(result.status).toBe(ResearchStatus.APPROVED);
    });

    it('reviewed 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.COMPLETED }));
      await expect(svc.approve('mr-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('승인된 시장조사는 수정 불가해야 한다', async () => {
      const { svc } = buildService(makeResearch({ status: ResearchStatus.APPROVED }));
      await expect(
        svc.update('mr-001', { itemName: '수정 시도' })
      ).rejects.toThrow(BadRequestException);
    });

    it('vendorQuotes 갱신 시 가격 범위를 자동 계산해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.update('mr-001', {
        vendorQuotes: [
          { vendorName: '업체A', vendorContact: 'a@a.com', unitPrice: 30000000, totalPrice: 30000000, currency: 'KRW' as const, leadTimeDays: 30, isCustomizable: false, quotedAt: '2026-04-14T10:00:00Z' },
          { vendorName: '업체B', vendorContact: 'b@b.com', unitPrice: 50000000, totalPrice: 50000000, currency: 'KRW' as const, leadTimeDays: 45, isCustomizable: true,  quotedAt: '2026-04-14T10:00:00Z' },
          { vendorName: '업체C', vendorContact: 'c@c.com', unitPrice: 40000000, totalPrice: 40000000, currency: 'KRW' as const, leadTimeDays: 60, isCustomizable: false, quotedAt: '2026-04-14T10:00:00Z' },
        ],
      });
      expect(result.estimatedMinPrice).toBe(30000000);
      expect(result.estimatedMaxPrice).toBe(50000000);
    });
  });

  describe('remove', () => {
    it('시장조사를 삭제할 수 있어야 한다', async () => {
      const { svc, repo } = buildService();
      await svc.remove('mr-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('전체 상태 흐름 (open → approved)', () => {
    it('open → completed → reviewed → approved 전환이 정상 작동해야 한다', async () => {
      const steps = [
        {
          status: ResearchStatus.OPEN,
          action: (s: MarketResearchesService) => s.complete('mr-001'),
          expected: ResearchStatus.COMPLETED,
        },
        {
          status: ResearchStatus.COMPLETED,
          action: (s: MarketResearchesService) => s.review('mr-001'),
          expected: ResearchStatus.REVIEWED,
        },
        {
          status: ResearchStatus.REVIEWED,
          action: (s: MarketResearchesService) => s.approve('mr-001'),
          expected: ResearchStatus.APPROVED,
        },
      ];

      for (const { status, action, expected } of steps) {
        const repo = makeRepo(makeResearch({ status })) as any;
        const svc  = new MarketResearchesService(repo);
        const result = await action(svc);
        expect(result.status).toBe(expected);
      }
    });
  });
});
