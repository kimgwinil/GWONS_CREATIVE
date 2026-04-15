/**
 * GWONS_CREATIVE — DeliverySchedulesService Unit Tests
 * Phase 3 합류: 납품 일정표 상태머신 + 이벤트 관리
 * planning → confirmed → in_progress → (delayed?) → completed
 */
import { DeliverySchedulesService } from '../delivery-schedules.service';
import {
  DeliverySchedule,
  DeliveryScheduleStatus,
  DeliveryEvent,
} from '../entities/delivery-schedule.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeEvents = (): DeliveryEvent[] => [
  {
    eventId: 'ev-001',
    orderType: 'purchase',
    orderId: 'po-001',
    orderNo: 'PO-2026-001',
    itemSummary: '인터랙티브 디스플레이 10대',
    vendorName: '(주)미디어테크',
    plannedDate: '2026-06-15',
    status: 'pending',
    location: '전시관 1층 납품장',
  },
  {
    eventId: 'ev-002',
    orderType: 'software',
    orderId: 'so-001',
    orderNo: 'SO-2026-001',
    itemSummary: '전시관리 소프트웨어 설치파일',
    vendorName: '스마트전시솔루션',
    plannedDate: '2026-06-10',
    status: 'pending',
    location: '온라인 납품',
  },
];

const makeSchedule = (
  overrides: Partial<DeliverySchedule> = {},
): DeliverySchedule => ({
  id: 'ds-001',
  title: '전시관 A동 통합 납품 일정표',
  description: 'H/W + S/W 납품 일정 통합 관리',
  status: DeliveryScheduleStatus.PLANNING,
  deliveryEvents: makeEvents(),
  installationLinks: [
    {
      zone: 'Zone-A 메인 전시실',
      requiredByDate: '2026-06-20',
      linkedOrderIds: ['po-001', 'so-001'],
    },
  ],
  targetCompletionDate: new Date('2026-06-30'),
  actualCompletionDate: null as any,
  totalEvents: 2,
  completedEvents: 0,
  delayedEvents: 0,
  procurementListId: 'pl-001',
  notes: '설치팀 일정과 연계 필수',
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: DeliverySchedule | null = makeSchedule()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find: jest.fn().mockResolvedValue(item ? [item] : []),
  count: jest.fn().mockResolvedValue(1),
  create: jest
    .fn()
    .mockImplementation((d: any) => ({ ...makeSchedule(), ...d })),
  save: jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove: jest.fn().mockResolvedValue(undefined),
});

const build = (item: DeliverySchedule | null = makeSchedule()) => {
  const repo = makeRepo(item) as any;
  return { svc: new DeliverySchedulesService(repo), repo };
};

describe('DeliverySchedulesService', () => {
  // ─────────────────────────────────────────────────────────
  // CRUD 기본
  // ─────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 납품 일정표를 반환해야 한다', async () => {
      const { svc } = build();
      const r = await svc.findOne('ds-001');
      expect(r.title).toBe('전시관 A동 통합 납품 일정표');
    });

    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('납품 일정표를 PLANNING 상태로 생성해야 한다', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '신규 납품 일정표',
        deliveryEvents: makeEvents(),
        targetCompletionDate: new Date('2026-07-01'),
      });
      expect(r.status).toBe(DeliveryScheduleStatus.PLANNING);
      expect(r.totalEvents).toBe(2);
    });

    it('deliveryEvents 없이도 생성 가능 (빈 배열)', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '빈 납품 일정표',
      });
      expect(r.deliveryEvents).toEqual([]);
      expect(r.totalEvents).toBe(0);
    });

    it('납품 이벤트 집계가 정확해야 한다', async () => {
      const { svc } = build();
      const events: DeliveryEvent[] = [
        ...makeEvents(),
        {
          eventId: 'ev-003',
          orderType: 'purchase',
          orderId: 'po-002',
          orderNo: 'PO-2026-002',
          itemSummary: '센서 모듈',
          vendorName: '센서코리아',
          plannedDate: '2026-06-20',
          status: 'delivered',
        },
      ];
      const r = await svc.create({
        projectId: 'proj-001',
        title: '혼합 일정표',
        deliveryEvents: events,
      });
      expect(r.totalEvents).toBe(3);
      expect(r.completedEvents).toBe(1);
    });
  });

  describe('update', () => {
    it('정상 업데이트 처리', async () => {
      const { svc } = build();
      const r = await svc.update('ds-001', { title: '업데이트된 납품 일정표' });
      expect(r.title).toBe('업데이트된 납품 일정표');
    });

    it('완료 상태(completed) 수정 → BadRequestException', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.COMPLETED }),
      );
      await expect(
        svc.update('ds-001', { title: '수정 시도' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('이벤트 업데이트 시 집계 재계산', async () => {
      const updatedEvents: DeliveryEvent[] = makeEvents().map((e, idx) => ({
        ...e,
        status: idx === 0 ? 'delivered' : 'delayed',
      }));
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.IN_PROGRESS }),
      );
      const r = await svc.update('ds-001', { deliveryEvents: updatedEvents });
      expect(r.completedEvents).toBe(1);
      expect(r.delayedEvents).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 상태 전환
  // ─────────────────────────────────────────────────────────
  describe('confirm', () => {
    it('planning → confirmed 전환', async () => {
      const { svc } = build();
      const r = await svc.confirm('ds-001');
      expect(r.status).toBe(DeliveryScheduleStatus.CONFIRMED);
    });

    it('납품 이벤트 없으면 BadRequestException', async () => {
      const { svc } = build(makeSchedule({ deliveryEvents: [] }));
      await expect(svc.confirm('ds-001')).rejects.toThrow(BadRequestException);
    });

    it('목표 완료일 없으면 BadRequestException', async () => {
      const { svc } = build(
        makeSchedule({ targetCompletionDate: null as any }),
      );
      await expect(svc.confirm('ds-001')).rejects.toThrow(BadRequestException);
    });

    it('planning 이외 상태 → BadRequestException', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.CONFIRMED }),
      );
      await expect(svc.confirm('ds-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('startProgress', () => {
    it('confirmed → in_progress 전환', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.CONFIRMED }),
      );
      const r = await svc.startProgress('ds-001');
      expect(r.status).toBe(DeliveryScheduleStatus.IN_PROGRESS);
    });

    it('confirmed 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.startProgress('ds-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateEvent', () => {
    it('이벤트 상태를 delivered로 업데이트', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.IN_PROGRESS }),
      );
      const r = await svc.updateEvent('ds-001', 'ev-001', {
        status: 'delivered',
        actualDate: '2026-06-15',
      });
      const ev = r.deliveryEvents.find((e) => e.eventId === 'ev-001');
      expect(ev?.status).toBe('delivered');
      expect(ev?.actualDate).toBe('2026-06-15');
      expect(r.completedEvents).toBe(1);
    });

    it('지연(delayed) 이벤트 → 스케줄 상태 DELAYED로 변경', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.IN_PROGRESS }),
      );
      const r = await svc.updateEvent('ds-001', 'ev-001', {
        status: 'delayed',
        delayDays: 5,
        delayReason: '제조사 생산 지연',
      });
      expect(r.status).toBe(DeliveryScheduleStatus.DELAYED);
      expect(r.delayedEvents).toBe(1);
    });

    it('모든 이벤트 delivered → 자동 완료(COMPLETED)', async () => {
      const allDelivered: DeliveryEvent[] = makeEvents().map((e) => ({
        ...e,
        status: e.eventId === 'ev-002' ? ('delivered' as any) : e.status,
      }));
      const schedule = makeSchedule({
        status: DeliveryScheduleStatus.IN_PROGRESS,
        deliveryEvents: allDelivered,
      });
      // ev-001만 pending 상태
      schedule.deliveryEvents[0].status = 'pending';
      const { svc } = build(schedule);
      const r = await svc.updateEvent('ds-001', 'ev-001', {
        status: 'delivered',
        actualDate: '2026-06-15',
      });
      expect(r.status).toBe(DeliveryScheduleStatus.COMPLETED);
      expect(r.actualCompletionDate).toBeDefined();
    });

    it('존재하지 않는 eventId → BadRequestException', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.IN_PROGRESS }),
      );
      await expect(
        svc.updateEvent('ds-001', 'invalid-ev', { status: 'delivered' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('in_progress → completed 강제 완료', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.IN_PROGRESS }),
      );
      const r = await svc.complete('ds-001');
      expect(r.status).toBe(DeliveryScheduleStatus.COMPLETED);
      expect(r.actualCompletionDate).toBeDefined();
    });

    it('delayed → completed 강제 완료', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.DELAYED }),
      );
      const r = await svc.complete('ds-001');
      expect(r.status).toBe(DeliveryScheduleStatus.COMPLETED);
    });

    it('planning 상태에서 완료 불가 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.complete('ds-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('planning 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('ds-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });

    it('confirmed 상태 삭제 → BadRequestException', async () => {
      const { svc } = build(
        makeSchedule({ status: DeliveryScheduleStatus.CONFIRMED }),
      );
      await expect(svc.remove('ds-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 통합 흐름
  // ─────────────────────────────────────────────────────────
  describe('전체 상태 흐름', () => {
    it('planning → confirmed → in_progress → completed 정상 작동', async () => {
      const flow: Array<{
        status: DeliveryScheduleStatus;
        action: (svc: DeliverySchedulesService) => Promise<DeliverySchedule>;
        expected: DeliveryScheduleStatus;
      }> = [
        {
          status: DeliveryScheduleStatus.PLANNING,
          action: (s) => s.confirm('ds-001'),
          expected: DeliveryScheduleStatus.CONFIRMED,
        },
        {
          status: DeliveryScheduleStatus.CONFIRMED,
          action: (s) => s.startProgress('ds-001'),
          expected: DeliveryScheduleStatus.IN_PROGRESS,
        },
        {
          status: DeliveryScheduleStatus.IN_PROGRESS,
          action: (s) => s.complete('ds-001'),
          expected: DeliveryScheduleStatus.COMPLETED,
        },
      ];
      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makeSchedule({ status })) as any;
        const r = await action(new DeliverySchedulesService(repo));
        expect(r.status).toBe(expected);
      }
    });

    it('지연 이후 복구 → completed 가능', async () => {
      const repo = makeRepo(
        makeSchedule({ status: DeliveryScheduleStatus.DELAYED }),
      ) as any;
      const svc = new DeliverySchedulesService(repo);
      const r = await svc.complete('ds-001');
      expect(r.status).toBe(DeliveryScheduleStatus.COMPLETED);
    });
  });
});
