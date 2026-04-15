/**
 * GWONS_CREATIVE — QualityInspectionsService Unit Tests
 * Phase 4 기획팀: 품질 점검 관리
 * scheduled → in_progress → completed(pass) or failed → re_inspected
 */
import { QualityInspectionsService } from '../quality-inspections.service';
import {
  QualityInspection, InspectionStatus, InspectionCategory,
  ChecklistItem, DefectRecord,
} from '../entities/quality-inspection.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeChecklist = (): ChecklistItem[] => [
  {
    itemId: 'ci-001', category: InspectionCategory.CONSTRUCTION,
    zone: 'Zone-A', checkPoint: '골조 수직 허용 오차',
    standard: '±5mm 이내', result: 'pending',
    isDefect: false,
  },
  {
    itemId: 'ci-002', category: InspectionCategory.SAFETY,
    zone: 'Zone-A', checkPoint: '소화기 배치 기준',
    standard: '15m 이내 1개 이상', result: 'pending',
    isDefect: false,
  },
  {
    itemId: 'ci-003', category: InspectionCategory.CONTENT,
    zone: 'Zone-B', checkPoint: '디스플레이 색상 캘리브레이션',
    standard: 'Delta-E ≤ 2', result: 'pending',
    isDefect: false,
  },
];

const makeInspection = (overrides: Partial<QualityInspection> = {}): QualityInspection => ({
  id: 'qi-001',
  title: '전시관 A동 1차 품질 점검',
  description: '시공 + 안전 기준 점검',
  status: InspectionStatus.SCHEDULED,
  category: InspectionCategory.CONSTRUCTION,
  checklistItems: makeChecklist(),
  defects: [],
  totalItems: 3,
  passedItems: 0,
  failedItems: 0,
  scheduledAt: new Date('2026-08-20T09:00:00Z'),
  startedAt: null as any,
  completedAt: null as any,
  inspector: '품질관리팀 최점검',
  targetZone: 'Zone-A',
  finalResult: null as any,
  overallComment: null as any,
  constructionPlanId: 'cp-001',
  contentInstallationId: null as any,
  inspectionRound: 1,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-08-15T10:00:00Z'),
  updatedAt: new Date('2026-08-15T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: QualityInspection | null = makeInspection()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeInspection(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: QualityInspection | null = makeInspection()) => {
  const repo = makeRepo(item) as any;
  return { svc: new QualityInspectionsService(repo), repo };
};

describe('QualityInspectionsService', () => {

  describe('findOne', () => {
    it('점검 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('qi-001');
      expect(r.category).toBe(InspectionCategory.CONSTRUCTION);
      expect(r.inspectionRound).toBe(1);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('SCHEDULED 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '신규 품질 점검',
        category: InspectionCategory.CONTENT,
      });
      expect(r.status).toBe(InspectionStatus.SCHEDULED);
      expect(r.inspectionRound).toBe(1);
    });

    it('체크리스트 항목 수 집계', async () => {
      const { svc } = build();
      const items: ChecklistItem[] = [
        { itemId: 'x1', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'C1', standard: 'S1', result: 'pass', isDefect: false },
        { itemId: 'x2', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'C2', standard: 'S2', result: 'fail', isDefect: true, defectSeverity: 'minor' },
        { itemId: 'x3', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'C3', standard: 'S3', result: 'pending', isDefect: false },
      ];
      const r = await svc.create({
        projectId: 'proj-001', title: 'Test', category: InspectionCategory.CONSTRUCTION,
        checklistItems: items,
      });
      expect(r.totalItems).toBe(3);
    });
  });

  describe('update', () => {
    it('체크리스트 수정 시 집계 재계산', async () => {
      const { svc } = build();
      const newItems: ChecklistItem[] = [
        { itemId: 'u1', category: InspectionCategory.SAFETY, zone: 'Z-A', checkPoint: 'P1', standard: 'S1', result: 'pass', isDefect: false },
        { itemId: 'u2', category: InspectionCategory.SAFETY, zone: 'Z-A', checkPoint: 'P2', standard: 'S2', result: 'pass', isDefect: false },
      ];
      const r = await svc.update('qi-001', { checklistItems: newItems });
      expect(r.totalItems).toBe(2);
      expect(r.passedItems).toBe(2);
    });

    it('완료 상태에서 수정 → BadRequest', async () => {
      const completed = makeInspection({ status: InspectionStatus.COMPLETED });
      const { svc } = build(completed);
      await expect(svc.update('qi-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });

    it('재검수 완료 상태에서 수정 → BadRequest', async () => {
      const reInspected = makeInspection({ status: InspectionStatus.RE_INSPECTED });
      const { svc } = build(reInspected);
      await expect(svc.update('qi-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('startInspection', () => {
    it('scheduled → in_progress', async () => {
      const { svc } = build();
      const r = await svc.startInspection('qi-001');
      expect(r.status).toBe(InspectionStatus.IN_PROGRESS);
      expect(r.startedAt).toBeTruthy();
    });

    it('scheduled 아닌 상태 → BadRequest', async () => {
      const inProgress = makeInspection({ status: InspectionStatus.IN_PROGRESS });
      const { svc } = build(inProgress);
      await expect(svc.startInspection('qi-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeInspection', () => {
    const inProgressWithAllPassed = makeInspection({
      status: InspectionStatus.IN_PROGRESS,
      checklistItems: [
        { itemId: 'c1', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'P1', standard: 'S1', result: 'pass', isDefect: false },
        { itemId: 'c2', category: InspectionCategory.SAFETY, zone: 'Z', checkPoint: 'P2', standard: 'S2', result: 'pass', isDefect: false },
      ],
    });

    it('in_progress → completed (pass)', async () => {
      const { svc } = build(inProgressWithAllPassed);
      const r = await svc.completeInspection('qi-001', {
        inspector: '최점검', finalResult: 'pass',
        overallComment: '전체 합격',
      });
      expect(r.status).toBe(InspectionStatus.COMPLETED);
      expect(r.finalResult).toBe('pass');
      expect(r.completedAt).toBeTruthy();
    });

    it('미검수 항목(pending) 있으면 → BadRequest', async () => {
      const hasPending = makeInspection({
        status: InspectionStatus.IN_PROGRESS,
        checklistItems: [
          { itemId: 'c1', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'P1', standard: 'S1', result: 'pass', isDefect: false },
          { itemId: 'c2', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'P2', standard: 'S2', result: 'pending', isDefect: false },
        ],
      });
      const { svc } = build(hasPending);
      await expect(svc.completeInspection('qi-001', { inspector: '최점검', finalResult: 'pass' }))
        .rejects.toThrow(BadRequestException);
    });

    it('in_progress 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // SCHEDULED
      await expect(svc.completeInspection('qi-001', { inspector: '최점검', finalResult: 'pass' }))
        .rejects.toThrow(BadRequestException);
    });

    it('fail 항목 있으면 결함 자동 생성 + failed 상태', async () => {
      const withFail = makeInspection({
        status: InspectionStatus.IN_PROGRESS,
        checklistItems: [
          { itemId: 'c1', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'P1', standard: 'S1', result: 'pass', isDefect: false },
          {
            itemId: 'c2', category: InspectionCategory.CONSTRUCTION, zone: 'Zone-A',
            checkPoint: '균열 확인', standard: '허용 균열 없음',
            result: 'fail', isDefect: true, defectSeverity: 'major',
            inspectorNote: '주요 균열 발견',
          },
        ],
      });
      const { svc } = build(withFail);
      const r = await svc.completeInspection('qi-001', { inspector: '최점검', finalResult: 'fail' });
      expect(r.status).toBe(InspectionStatus.FAILED);
      expect(r.defects.length).toBe(1);
      expect(r.defects[0].severity).toBe('major');
    });
  });

  describe('resolveDefect', () => {
    const withDefects = makeInspection({
      status: InspectionStatus.FAILED,
      defects: [
        {
          defectId: 'defect-001', checklistItemId: 'c2',
          severity: 'major', category: InspectionCategory.CONSTRUCTION,
          zone: 'Zone-A', description: '주요 균열',
          assignedTo: '시공팀', dueDate: '2026-08-30',
          status: 'open',
        },
      ],
    });

    it('결함 해결 처리', async () => {
      const { svc } = build(withDefects);
      const r = await svc.resolveDefect('qi-001', 'defect-001', { resolution: '균열 보수 완료' });
      const resolved = r.defects.find(d => d.defectId === 'defect-001')!;
      expect(resolved.status).toBe('resolved');
      expect(resolved.resolution).toBe('균열 보수 완료');
    });

    it('없는 결함 ID → BadRequest', async () => {
      const { svc } = build(withDefects);
      await expect(svc.resolveDefect('qi-001', 'no-defect', { resolution: '조치' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('markReInspected', () => {
    const failedWithResolvedDefects = makeInspection({
      status: InspectionStatus.FAILED,
      defects: [
        {
          defectId: 'd-001', checklistItemId: 'c2',
          severity: 'major', category: InspectionCategory.CONSTRUCTION,
          zone: 'Zone-A', description: '균열',
          assignedTo: '시공팀', dueDate: '2026-08-30',
          status: 'resolved', resolution: '보수 완료',
        },
      ],
      inspectionRound: 1,
    });

    it('failed → re_inspected (모든 결함 해결 후)', async () => {
      const { svc } = build(failedWithResolvedDefects);
      const r = await svc.markReInspected('qi-001', '최점검');
      expect(r.status).toBe(InspectionStatus.RE_INSPECTED);
      expect(r.inspectionRound).toBe(2);
    });

    it('미해결 결함 있으면 → BadRequest', async () => {
      const withOpenDefect = makeInspection({
        status: InspectionStatus.FAILED,
        defects: [
          {
            defectId: 'd-001', checklistItemId: 'c2',
            severity: 'major', category: InspectionCategory.CONSTRUCTION,
            zone: 'Zone-A', description: '균열',
            assignedTo: '시공팀', dueDate: '2026-08-30',
            status: 'open',
          },
        ],
      });
      const { svc } = build(withOpenDefect);
      await expect(svc.markReInspected('qi-001', '최점검')).rejects.toThrow(BadRequestException);
    });

    it('failed 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // SCHEDULED
      await expect(svc.markReInspected('qi-001', '최점검')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('SCHEDULED 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('qi-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('COMPLETED 상태 삭제 → BadRequest', async () => {
      const completed = makeInspection({ status: InspectionStatus.COMPLETED });
      const { svc } = build(completed);
      await expect(svc.remove('qi-001')).rejects.toThrow(BadRequestException);
    });

    it('RE_INSPECTED 상태 삭제 → BadRequest', async () => {
      const reInspected = makeInspection({ status: InspectionStatus.RE_INSPECTED });
      const { svc } = build(reInspected);
      await expect(svc.remove('qi-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로', () => {
    it('scheduled → in_progress → completed (pass) 전체 흐름', async () => {
      // 1. SCHEDULED 생성
      const repo1 = makeRepo(makeInspection({ status: InspectionStatus.SCHEDULED })) as any;
      const svc1 = new QualityInspectionsService(repo1);
      const started = await svc1.startInspection('qi-001');
      expect(started.status).toBe(InspectionStatus.IN_PROGRESS);

      // 2. IN_PROGRESS → COMPLETED (pass)
      const allPassed = makeInspection({
        status: InspectionStatus.IN_PROGRESS,
        checklistItems: [
          { itemId: 'p1', category: InspectionCategory.CONSTRUCTION, zone: 'Z', checkPoint: 'P1', standard: 'S1', result: 'pass', isDefect: false },
          { itemId: 'p2', category: InspectionCategory.SAFETY, zone: 'Z', checkPoint: 'P2', standard: 'S2', result: 'pass', isDefect: false },
          { itemId: 'p3', category: InspectionCategory.CONTENT, zone: 'Z', checkPoint: 'P3', standard: 'S3', result: 'pass', isDefect: false },
        ],
      });
      const repo2 = makeRepo(allPassed) as any;
      const svc2 = new QualityInspectionsService(repo2);
      const completed = await svc2.completeInspection('qi-001', {
        inspector: '최점검', finalResult: 'pass',
        overallComment: '전체 합격. Phase 4 품질 기준 충족.',
      });
      expect(completed.status).toBe(InspectionStatus.COMPLETED);
      expect(completed.finalResult).toBe('pass');
      expect(completed.passedItems).toBe(3);
      expect(completed.failedItems).toBe(0);
    });

    it('scheduled → in_progress → failed → re_inspected 흐름', async () => {
      // 1. FAILED 상태 (결함 자동 생성)
      const failedState = makeInspection({
        status: InspectionStatus.FAILED,
        defects: [
          {
            defectId: 'def-001', checklistItemId: 'c2',
            severity: 'minor', category: InspectionCategory.CONSTRUCTION,
            zone: 'Zone-A', description: '도장 불량',
            assignedTo: '시공팀', dueDate: '2026-08-28',
            status: 'resolved', resolution: '재도장 완료',
          },
        ],
        inspectionRound: 1,
      });
      const repo = makeRepo(failedState) as any;
      const svc = new QualityInspectionsService(repo);

      // 2. 재검수 완료
      const reInspected = await svc.markReInspected('qi-001', '최점검');
      expect(reInspected.status).toBe(InspectionStatus.RE_INSPECTED);
      expect(reInspected.inspectionRound).toBe(2);
    });
  });
});
