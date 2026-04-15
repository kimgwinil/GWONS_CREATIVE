/**
 * GWONS_CREATIVE — PurchaseOrdersService Unit Tests
 * Phase 3 — H/W 발주 상태머신
 * draft → submitted → confirmed → in_transit → delivered → inspected
 */
import { PurchaseOrdersService } from '../purchase-orders.service';
import { PurchaseOrder, PurchaseOrderStatus, PaymentTerms, OrderLineItem } from '../entities/purchase-order.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeLineItems = (): OrderLineItem[] => [
  { lineNo: 1, itemName: '55인치 인터랙티브 터치 디스플레이', specification: '4K UHD 400nit', quantity: 4, unit: '대', unitPrice: 3500000, totalPrice: 14000000, currency: 'KRW' },
  { lineNo: 2, itemName: '뎁스 센서 (ToF)', specification: 'Range 0.3m~5m, 30fps', quantity: 8, unit: '개', unitPrice: 850000, totalPrice: 6800000, currency: 'KRW' },
];

const makePO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: 'po-001',
  orderNo: 'PO-2026-001',
  title: 'H/W 1차 발주 — 디스플레이·센서',
  status: PurchaseOrderStatus.DRAFT,
  vendorName: '(주)테크서플라이',
  vendorContact: '010-0000-0000',
  vendorEmail: 'supply@tech.co.kr',
  lineItems: makeLineItems(),
  totalAmount: 20800000,
  currency: 'KRW',
  paymentTerms: PaymentTerms.NET_30,
  requiredDeliveryDate: new Date('2026-06-01'),
  expectedDeliveryDate: null as any,
  actualDeliveryDate: null as any,
  deliveryAddress: '서울시 강남구 전시관 A동',
  inspectionResult: null as any,
  specialConditions: null as any,
  procurementListId: 'pl-001',
  orderedBy: '조달팀_김조달',
  submittedAt: null as any,
  confirmedAt: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: PurchaseOrder | null = makePO()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makePO(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: PurchaseOrder | null = makePO()) => {
  const repo = makeRepo(item) as any;
  return { svc: new PurchaseOrdersService(repo), repo };
};

describe('PurchaseOrdersService', () => {

  describe('findOne', () => {
    it('발주서를 반환해야 한다', async () => {
      const { svc } = build();
      const r = await svc.findOne('po-001');
      expect(r.orderNo).toBe('PO-2026-001');
    });
    it('없는 발주서 → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('발주서를 draft 상태로 생성 + totalAmount 자동 계산', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', orderNo: 'PO-2026-002',
        title: '신규 발주', vendorName: '(주)테크',
        lineItems: makeLineItems(),
      });
      expect(r.status).toBe(PurchaseOrderStatus.DRAFT);
      expect(r.totalAmount).toBe(20800000);
    });
  });

  describe('submit', () => {
    it('draft → submitted + submittedAt 설정', async () => {
      const { svc } = build();
      const r = await svc.submit('po-001');
      expect(r.status).toBe(PurchaseOrderStatus.SUBMITTED);
      expect(r.submittedAt).toBeDefined();
    });
    it('lineItems 없으면 → BadRequestException', async () => {
      const { svc } = build(makePO({ lineItems: [] }));
      await expect(svc.submit('po-001')).rejects.toThrow(BadRequestException);
    });
    it('draft 이외 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.SUBMITTED }));
      await expect(svc.submit('po-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('submitted → confirmed + confirmedAt', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.SUBMITTED }));
      const r = await svc.confirm('po-001', new Date('2026-05-28'));
      expect(r.status).toBe(PurchaseOrderStatus.CONFIRMED);
      expect(r.confirmedAt).toBeDefined();
      expect(r.expectedDeliveryDate).toEqual(new Date('2026-05-28'));
    });
    it('submitted 이외 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.DRAFT }));
      await expect(svc.confirm('po-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('startTransit', () => {
    it('confirmed → in_transit', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.CONFIRMED }));
      const r = await svc.startTransit('po-001');
      expect(r.status).toBe(PurchaseOrderStatus.IN_TRANSIT);
    });
  });

  describe('deliver', () => {
    it('in_transit → delivered + actualDeliveryDate', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.IN_TRANSIT }));
      const r = await svc.deliver('po-001');
      expect(r.status).toBe(PurchaseOrderStatus.DELIVERED);
      expect(r.actualDeliveryDate).toBeDefined();
    });
    it('in_transit 이외 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.CONFIRMED }));
      await expect(svc.deliver('po-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('inspect', () => {
    it('delivered → inspected + 검수 결과 기록', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.DELIVERED }));
      const r = await svc.inspect('po-001', {
        inspectedBy: '검수팀_이검수',
        passedItems: 12,
        failedItems: 0,
        overallResult: 'pass',
      });
      expect(r.status).toBe(PurchaseOrderStatus.INSPECTED);
      expect(r.inspectionResult.passedItems).toBe(12);
      expect(r.inspectionResult.overallResult).toBe('pass');
    });
    it('delivered 이외 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.IN_TRANSIT }));
      await expect(
        svc.inspect('po-001', { inspectedBy: '검수팀', passedItems: 1, failedItems: 0, overallResult: 'pass' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('draft → cancelled', async () => {
      const { svc } = build();
      const r = await svc.cancel('po-001', '예산 초과로 취소');
      expect(r.status).toBe(PurchaseOrderStatus.CANCELLED);
    });
    it('delivered 상태 취소 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.DELIVERED }));
      await expect(svc.cancel('po-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('inspected 상태 수정 → BadRequestException', async () => {
      const { svc } = build(makePO({ status: PurchaseOrderStatus.INSPECTED }));
      await expect(svc.update('po-001', { title: '수정 시도' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 상태 흐름 (draft → inspected)', () => {
    it('6단계 전환이 순서대로 작동해야 한다', async () => {
      const steps = [
        { s: PurchaseOrderStatus.DRAFT,      a: (x: PurchaseOrdersService) => x.submit('po-001'),                                                               e: PurchaseOrderStatus.SUBMITTED },
        { s: PurchaseOrderStatus.SUBMITTED,  a: (x: PurchaseOrdersService) => x.confirm('po-001'),                                                              e: PurchaseOrderStatus.CONFIRMED },
        { s: PurchaseOrderStatus.CONFIRMED,  a: (x: PurchaseOrdersService) => x.startTransit('po-001'),                                                         e: PurchaseOrderStatus.IN_TRANSIT },
        { s: PurchaseOrderStatus.IN_TRANSIT, a: (x: PurchaseOrdersService) => x.deliver('po-001'),                                                              e: PurchaseOrderStatus.DELIVERED },
        { s: PurchaseOrderStatus.DELIVERED,  a: (x: PurchaseOrdersService) => x.inspect('po-001', { inspectedBy: '검수팀', passedItems: 12, failedItems: 0, overallResult: 'pass' }), e: PurchaseOrderStatus.INSPECTED },
      ];
      for (const { s, a, e } of steps) {
        const repo = makeRepo(makePO({ status: s })) as any;
        const r = await a(new PurchaseOrdersService(repo));
        expect(r.status).toBe(e);
      }
    });
  });
});
