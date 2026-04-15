/**
 * GWONS_CREATIVE — SiteVisualizationsService Unit Tests
 * Phase 4 3D팀: 현장 시각화 지원·수정
 * draft → in_review ⇄ revision → approved → final
 */
import { SiteVisualizationsService } from '../site-visualizations.service';
import {
  SiteVisualization, SiteVisualizationStatus, VisualizationType,
} from '../entities/site-visualization.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeViz = (overrides: Partial<SiteVisualization> = {}): SiteVisualization => ({
  id: 'sv-001',
  title: '메인 전시홀 준공 후 시각화 v1',
  description: '설계 vs 실제 비교 포함',
  vizType: VisualizationType.AS_BUILT,
  status: SiteVisualizationStatus.DRAFT,
  sourceFileUrl: 'https://cdn.example.com/sv-001.fbx',
  outputFileUrl: 'https://cdn.example.com/sv-001-render.jpg',
  thumbnailUrl: null as any,
  revisionHistory: [],
  comparisonData: [],
  currentRevision: 0,
  targetZone: 'Zone-A 메인 전시홀',
  constructionPlanId: 'cp-001',
  renderAssetId: 'ra-001',
  createdBy: '3D디자이너 이지원',
  approvedBy: null as any,
  approvedAt: null as any,
  reviewNotes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-05-01T10:00:00Z'),
  updatedAt: new Date('2026-05-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: SiteVisualization | null = makeViz()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeViz(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: SiteVisualization | null = makeViz()) => {
  const repo = makeRepo(item) as any;
  return { svc: new SiteVisualizationsService(repo), repo };
};

describe('SiteVisualizationsService', () => {

  describe('findOne', () => {
    it('시각화 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('sv-001');
      expect(r.vizType).toBe(VisualizationType.AS_BUILT);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('DRAFT 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', title: '신규 시각화',
        vizType: VisualizationType.PROGRESS_VIZ,
      });
      expect(r.status).toBe(SiteVisualizationStatus.DRAFT);
      expect(r.currentRevision).toBe(0);
    });
  });

  describe('submitForReview', () => {
    it('draft → in_review', async () => {
      const { svc } = build();
      const r = await svc.submitForReview('sv-001');
      expect(r.status).toBe(SiteVisualizationStatus.IN_REVIEW);
    });
    it('파일 URL 없으면 BadRequestException', async () => {
      const { svc } = build(makeViz({ sourceFileUrl: null as any, outputFileUrl: null as any }));
      await expect(svc.submitForReview('sv-001')).rejects.toThrow(BadRequestException);
    });
    it('revision 상태에서도 검토 요청 가능', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.REVISION }));
      const r = await svc.submitForReview('sv-001');
      expect(r.status).toBe(SiteVisualizationStatus.IN_REVIEW);
    });
    it('approved 상태에서 검토 요청 불가', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.APPROVED }));
      await expect(svc.submitForReview('sv-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('requestRevision', () => {
    it('in_review → revision + 수정 이력 추가', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.IN_REVIEW }));
      const r = await svc.requestRevision('sv-001', {
        requestedBy: '기획팀장',
        reason: '현장 실측 반영 필요',
        description: 'Zone-A 기둥 위치 수정 요청',
      });
      expect(r.status).toBe(SiteVisualizationStatus.REVISION);
      expect(r.currentRevision).toBe(1);
      expect(r.revisionHistory).toHaveLength(1);
      expect(r.revisionHistory[0].reason).toBe('현장 실측 반영 필요');
    });
    it('in_review 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(
        svc.requestRevision('sv-001', { requestedBy: '팀장', reason: 'test', description: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRevision', () => {
    it('revision → in_review (수정 완료)', async () => {
      const viz = makeViz({
        status: SiteVisualizationStatus.REVISION,
        currentRevision: 1,
        revisionHistory: [{
          revNo: 1, requestedBy: '기획팀장', requestedAt: '2026-05-05T10:00:00Z',
          reason: '수정 필요', description: '기둥 위치 수정',
        }],
      });
      const { svc } = build(viz);
      const r = await svc.completeRevision('sv-001', {
        result: 'Zone-A 기둥 위치 수정 완료',
        outputFileUrl: 'https://cdn.example.com/sv-001-r1.jpg',
      });
      expect(r.status).toBe(SiteVisualizationStatus.IN_REVIEW);
      expect(r.outputFileUrl).toBe('https://cdn.example.com/sv-001-r1.jpg');
      expect(r.revisionHistory[0].completedAt).toBeDefined();
    });
    it('revision 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(
        svc.completeRevision('sv-001', { result: '완료' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('in_review → approved', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.IN_REVIEW }));
      const r = await svc.approve('sv-001', { approvedBy: '기획팀장', notes: '현장 반영 확인' });
      expect(r.status).toBe(SiteVisualizationStatus.APPROVED);
      expect(r.approvedBy).toBe('기획팀장');
      expect(r.approvedAt).toBeDefined();
    });
    it('in_review 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(
        svc.approve('sv-001', { approvedBy: '팀장' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('finalize', () => {
    it('approved → final', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.APPROVED }));
      const r = await svc.finalize('sv-001');
      expect(r.status).toBe(SiteVisualizationStatus.FINAL);
    });
    it('approved 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.finalize('sv-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('final 상태 수정 불가', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.FINAL }));
      await expect(svc.update('sv-001', { title: '수정 시도' })).rejects.toThrow(BadRequestException);
    });
    it('draft 상태 수정 가능', async () => {
      const { svc } = build();
      const r = await svc.update('sv-001', { title: '수정된 시각화' });
      expect(r.title).toBe('수정된 시각화');
    });
  });

  describe('remove', () => {
    it('draft 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('sv-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
    it('approved 상태 삭제 불가', async () => {
      const { svc } = build(makeViz({ status: SiteVisualizationStatus.APPROVED }));
      await expect(svc.remove('sv-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 흐름 — 수정 1회 포함', () => {
    it('draft → in_review → revision → in_review → approved → final', async () => {
      const flow = [
        { status: SiteVisualizationStatus.DRAFT,      action: (s: SiteVisualizationsService) => s.submitForReview('sv-001'),                                      expected: SiteVisualizationStatus.IN_REVIEW },
        { status: SiteVisualizationStatus.IN_REVIEW,  action: (s: SiteVisualizationsService) => s.requestRevision('sv-001', { requestedBy: 'PM', reason: 'r', description: 'd' }), expected: SiteVisualizationStatus.REVISION },
        { status: SiteVisualizationStatus.REVISION,   action: (s: SiteVisualizationsService) => s.completeRevision('sv-001', { result: '완료' }),                  expected: SiteVisualizationStatus.IN_REVIEW },
        { status: SiteVisualizationStatus.IN_REVIEW,  action: (s: SiteVisualizationsService) => s.approve('sv-001', { approvedBy: '팀장' }),                       expected: SiteVisualizationStatus.APPROVED },
        { status: SiteVisualizationStatus.APPROVED,   action: (s: SiteVisualizationsService) => s.finalize('sv-001'),                                             expected: SiteVisualizationStatus.FINAL },
      ];
      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makeViz({ status,
          sourceFileUrl: 'url', outputFileUrl: 'url',
          revisionHistory: status === SiteVisualizationStatus.REVISION
            ? [{ revNo: 1, requestedBy: 'PM', requestedAt: '2026-05-05T10:00:00Z', reason: 'r', description: 'd' }]
            : [],
          currentRevision: status === SiteVisualizationStatus.REVISION ? 1 : 0,
        })) as any;
        const r = await action(new SiteVisualizationsService(repo));
        expect(r.status).toBe(expected);
      }
    });
  });
});
