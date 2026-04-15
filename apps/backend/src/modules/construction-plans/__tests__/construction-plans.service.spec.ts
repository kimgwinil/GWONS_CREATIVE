/**
 * GWONS_CREATIVE — ConstructionPlansService Unit Tests
 * Phase 4 시공팀: 공간 시공 + 구조물 설치
 * planning → approved → in_progress → (suspended?) → completed → inspected
 */
import { ConstructionPlansService } from '../construction-plans.service';
import { ConstructionPlan, ConstructionStatus, ConstructionTask } from '../entities/construction-plan.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeTasks = (): ConstructionTask[] => [
  { taskId: 'task-001', taskName: '메인 전시홀 골조 공사', zone: 'Zone-A', zoneType: 'main_hall' as any,
    contractor: '(주)건설코리아', plannedStart: '2026-07-01', plannedEnd: '2026-07-20',
    status: 'pending', progressRate: 0 },
  { taskId: 'task-002', taskName: '체험존 파티션 설치', zone: 'Zone-B', zoneType: 'experience' as any,
    contractor: '인테리어서울', plannedStart: '2026-07-15', plannedEnd: '2026-07-30',
    status: 'pending', progressRate: 0 },
  { taskId: 'task-003', taskName: '전기 배선 공사', zone: 'Zone-A', zoneType: 'utility' as any,
    contractor: '(주)전기테크', plannedStart: '2026-07-10', plannedEnd: '2026-07-25',
    status: 'pending', progressRate: 0 },
];

const makePlan = (overrides: Partial<ConstructionPlan> = {}): ConstructionPlan => ({
  id: 'cp-001',
  title: '전시관 A동 시공 계획서 v1',
  description: '메인 전시홀 + 체험존 시공',
  status: ConstructionStatus.PLANNING,
  tasks: makeTasks(),
  structureItems: [],
  safetyChecks: [],
  overallProgressRate: 0,
  totalTasks: 3,
  completedTasks: 0,
  delayedTasks: 0,
  plannedStartDate: new Date('2026-07-01'),
  plannedEndDate: new Date('2026-08-31'),
  actualEndDate: null as any,
  siteManager: '김현장',
  inspectedBy: null as any,
  inspectedAt: null as any,
  procurementListId: 'pl-001',
  notes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-05-01T10:00:00Z'),
  updatedAt: new Date('2026-05-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: ConstructionPlan | null = makePlan()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makePlan(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: ConstructionPlan | null = makePlan()) => {
  const repo = makeRepo(item) as any;
  return { svc: new ConstructionPlansService(repo), repo };
};

describe('ConstructionPlansService', () => {

  describe('findOne', () => {
    it('시공 계획서 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('cp-001');
      expect(r.title).toContain('시공 계획서');
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('시공 계획서를 PLANNING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', title: '신규 시공 계획',
        tasks: makeTasks(), plannedEndDate: new Date('2026-08-31'),
      });
      expect(r.status).toBe(ConstructionStatus.PLANNING);
      expect(r.totalTasks).toBe(3);
      expect(r.overallProgressRate).toBe(0);
    });

    it('tasks 없이도 생성 가능', async () => {
      const { svc } = build();
      const r = await svc.create({ projectId: 'proj-001', title: '빈 시공 계획' });
      expect(r.tasks).toEqual([]);
      expect(r.totalTasks).toBe(0);
    });
  });

  describe('approve', () => {
    it('planning → approved', async () => {
      const { svc } = build();
      const r = await svc.approve('cp-001');
      expect(r.status).toBe(ConstructionStatus.APPROVED);
    });
    it('tasks 없으면 BadRequestException', async () => {
      const { svc } = build(makePlan({ tasks: [] }));
      await expect(svc.approve('cp-001')).rejects.toThrow(BadRequestException);
    });
    it('plannedEndDate 없으면 BadRequestException', async () => {
      const { svc } = build(makePlan({ plannedEndDate: null as any }));
      await expect(svc.approve('cp-001')).rejects.toThrow(BadRequestException);
    });
    it('planning 이외 상태 → BadRequestException', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.APPROVED }));
      await expect(svc.approve('cp-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('start', () => {
    it('approved → in_progress', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.APPROVED }));
      const r = await svc.start('cp-001');
      expect(r.status).toBe(ConstructionStatus.IN_PROGRESS);
    });
    it('approved 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.start('cp-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTask', () => {
    it('작업 진행률 업데이트', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS }));
      const r = await svc.updateTask('cp-001', 'task-001', {
        status: 'in_progress', progressRate: 50,
        actualStart: '2026-07-01',
      });
      const task = r.tasks.find(t => t.taskId === 'task-001');
      expect(task?.progressRate).toBe(50);
      expect(task?.status).toBe('in_progress');
    });

    it('존재하지 않는 taskId → BadRequestException', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS }));
      await expect(
        svc.updateTask('cp-001', 'invalid-task', { status: 'in_progress', progressRate: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('모든 작업 완료 시 COMPLETED 자동 전환', async () => {
      const allDoneTasks: ConstructionTask[] = makeTasks().map(t =>
        t.taskId !== 'task-001' ? { ...t, status: 'completed' as any, progressRate: 100 } : t,
      );
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS, tasks: allDoneTasks }));
      const r = await svc.updateTask('cp-001', 'task-001', {
        status: 'completed', progressRate: 100,
        actualEnd: '2026-07-20',
      });
      expect(r.status).toBe(ConstructionStatus.COMPLETED);
      expect(r.actualEndDate).toBeDefined();
    });

    it('진행 중 이외 상태 → BadRequestException', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.APPROVED }));
      await expect(
        svc.updateTask('cp-001', 'task-001', { status: 'in_progress', progressRate: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspend / resume', () => {
    it('in_progress → suspended', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS }));
      const r = await svc.suspend('cp-001', '자재 공급 지연');
      expect(r.status).toBe(ConstructionStatus.SUSPENDED);
      expect(r.notes).toContain('자재 공급 지연');
    });
    it('suspended → in_progress (재개)', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.SUSPENDED }));
      const r = await svc.resume('cp-001');
      expect(r.status).toBe(ConstructionStatus.IN_PROGRESS);
    });
    it('in_progress 이외 중단 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.suspend('cp-001', '이유')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('in_progress → completed', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS }));
      const r = await svc.complete('cp-001');
      expect(r.status).toBe(ConstructionStatus.COMPLETED);
      expect(r.actualEndDate).toBeDefined();
    });
    it('suspended → completed', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.SUSPENDED }));
      const r = await svc.complete('cp-001');
      expect(r.status).toBe(ConstructionStatus.COMPLETED);
    });
    it('planning 상태 완료 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.complete('cp-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('inspect (준공 검수)', () => {
    it('completed → inspected', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.COMPLETED }));
      const r = await svc.inspect('cp-001', { inspectedBy: '감리단장', result: 'pass' });
      expect(r.status).toBe(ConstructionStatus.INSPECTED);
      expect(r.inspectedBy).toBe('감리단장');
      expect(r.inspectedAt).toBeDefined();
    });
    it('검수 불합격 시 BadRequestException', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.COMPLETED }));
      await expect(
        svc.inspect('cp-001', { inspectedBy: '감리단장', result: 'fail' }),
      ).rejects.toThrow(BadRequestException);
    });
    it('completed 이외 상태 검수 → BadRequestException', async () => {
      const { svc } = build();
      await expect(
        svc.inspect('cp-001', { inspectedBy: '감리단장', result: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('planning 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('cp-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
    it('in_progress 상태 삭제 → BadRequestException', async () => {
      const { svc } = build(makePlan({ status: ConstructionStatus.IN_PROGRESS }));
      await expect(svc.remove('cp-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 흐름 — 시공 완료 → 준공 검수', () => {
    it('planning → approved → in_progress → completed → inspected', async () => {
      const flow: Array<{
        status: ConstructionStatus;
        action: (s: ConstructionPlansService) => Promise<ConstructionPlan>;
        expected: ConstructionStatus;
      }> = [
        { status: ConstructionStatus.PLANNING,     action: s => s.approve('cp-001'),   expected: ConstructionStatus.APPROVED },
        { status: ConstructionStatus.APPROVED,     action: s => s.start('cp-001'),     expected: ConstructionStatus.IN_PROGRESS },
        { status: ConstructionStatus.IN_PROGRESS,  action: s => s.complete('cp-001'),  expected: ConstructionStatus.COMPLETED },
        { status: ConstructionStatus.COMPLETED,    action: s => s.inspect('cp-001', { inspectedBy: '감리', result: 'pass' }), expected: ConstructionStatus.INSPECTED },
      ];
      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makePlan({ status })) as any;
        const r = await action(new ConstructionPlansService(repo));
        expect(r.status).toBe(expected);
      }
    });
  });
});
