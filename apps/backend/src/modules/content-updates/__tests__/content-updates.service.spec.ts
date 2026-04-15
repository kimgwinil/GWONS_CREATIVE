/**
 * GWONS_CREATIVE — ContentUpdatesService Unit Tests
 * Phase 5 3D/2D팀: 추가 콘텐츠 업데이트 지원
 * requested → in_progress → review → approved → deployed
 */
import { ContentUpdatesService } from '../content-updates.service';
import {
  ContentUpdate, ContentUpdateStatus, UpdateType, UpdatePriority,
  UpdateTargetItem,
} from '../entities/content-update.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeTargetItems = (): UpdateTargetItem[] => [
  {
    itemId: 'item-001', targetName: '메인 홀 미디어 월 콘텐츠',
    targetZone: 'Zone-A', currentVersion: '1.0.0', newVersion: '1.1.0',
    fileUrl: 'https://cdn/content-v1.1.0.zip',
    changeDescription: '계절 테마 교체 (가을 → 겨울)', status: 'pending',
  },
  {
    itemId: 'item-002', targetName: '입구 키오스크 UI',
    targetZone: 'Entrance', currentVersion: '3.0.1', newVersion: '3.1.0',
    changeDescription: '관람객 안내 UI 개선', status: 'pending',
  },
];

const makeUpdate = (overrides: Partial<ContentUpdate> = {}): ContentUpdate => ({
  id: 'cu-001',
  title: '전시관 A동 겨울 시즌 콘텐츠 업데이트',
  description: '2026-12 시즌 콘텐츠 교체',
  status: ContentUpdateStatus.REQUESTED,
  updateType: UpdateType.SEASONAL_UPDATE,
  priority: UpdatePriority.NORMAL,
  targetItems: makeTargetItems(),
  reviewHistory: [],
  totalItems: 2,
  completedItems: 0,
  requestedBy: '기획팀 최운영',
  assignedTo: '3D팀 이지원',
  deployedBy: null as any,
  deployedAt: null as any,
  requestedDeadline: new Date('2026-12-01'),
  notes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  updatedAt: new Date('2026-11-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: ContentUpdate | null = makeUpdate()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeUpdate(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: ContentUpdate | null = makeUpdate()) => {
  const repo = makeRepo(item) as any;
  return { svc: new ContentUpdatesService(repo), repo };
};

describe('ContentUpdatesService', () => {

  describe('findOne', () => {
    it('콘텐츠 업데이트 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('cu-001');
      expect(r.updateType).toBe(UpdateType.SEASONAL_UPDATE);
      expect(r.targetItems).toHaveLength(2);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('REQUESTED 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', title: '신규 콘텐츠 교체',
        updateType: UpdateType.CONTENT_REPLACE,
      });
      expect(r.status).toBe(ContentUpdateStatus.REQUESTED);
      expect(r.totalItems).toBe(0);
    });

    it('targetItems 제공 시 집계 계산', async () => {
      const { svc } = build();
      const items = makeTargetItems().map(i => ({ ...i, status: 'completed' as const }));
      const r = await svc.create({
        projectId: 'proj-001', title: '테스트', updateType: UpdateType.BUGFIX,
        targetItems: items,
      });
      expect(r.totalItems).toBe(2);
    });
  });

  describe('update', () => {
    it('targetItems 수정 시 집계 재계산', async () => {
      const { svc } = build();
      const newItems = makeTargetItems().map(i => ({ ...i, status: 'completed' as const }));
      const r = await svc.update('cu-001', { targetItems: newItems });
      expect(r.totalItems).toBe(2);
      expect(r.completedItems).toBe(2);
    });

    it('DEPLOYED 상태에서 수정 → BadRequest', async () => {
      const deployed = makeUpdate({ status: ContentUpdateStatus.DEPLOYED });
      const { svc } = build(deployed);
      await expect(svc.update('cu-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });

    it('REJECTED 상태에서 수정 → BadRequest', async () => {
      const rejected = makeUpdate({ status: ContentUpdateStatus.REJECTED });
      const { svc } = build(rejected);
      await expect(svc.update('cu-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('startWork', () => {
    it('requested → in_progress', async () => {
      const { svc } = build();
      const r = await svc.startWork('cu-001');
      expect(r.status).toBe(ContentUpdateStatus.IN_PROGRESS);
    });

    it('targetItems 없으면 → BadRequest', async () => {
      const noItems = makeUpdate({ targetItems: [] });
      const { svc } = build(noItems);
      await expect(svc.startWork('cu-001')).rejects.toThrow(BadRequestException);
    });

    it('requested 아닌 상태 → BadRequest', async () => {
      const inProgress = makeUpdate({ status: ContentUpdateStatus.IN_PROGRESS });
      const { svc } = build(inProgress);
      await expect(svc.startWork('cu-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItemStatus', () => {
    const inProgressState = makeUpdate({ status: ContentUpdateStatus.IN_PROGRESS });

    it('항목 상태 completed로 업데이트', async () => {
      const { svc } = build(inProgressState);
      const r = await svc.updateItemStatus('cu-001', 'item-001', { status: 'completed' });
      const updatedItem = r.targetItems.find(i => i.itemId === 'item-001')!;
      expect(updatedItem.status).toBe('completed');
      expect(r.completedItems).toBe(1);
    });

    it('없는 항목 ID → BadRequest', async () => {
      const { svc } = build(inProgressState);
      await expect(svc.updateItemStatus('cu-001', 'no-item', { status: 'completed' }))
        .rejects.toThrow(BadRequestException);
    });

    it('in_progress 아닌 상태에서 → BadRequest', async () => {
      const { svc } = build();  // REQUESTED
      await expect(svc.updateItemStatus('cu-001', 'item-001', { status: 'completed' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForReview', () => {
    it('in_progress → review (모든 항목 완료)', async () => {
      const allDone = makeUpdate({
        status: ContentUpdateStatus.IN_PROGRESS,
        targetItems: makeTargetItems().map(i => ({ ...i, status: 'completed' as const })),
      });
      const { svc } = build(allDone);
      const r = await svc.submitForReview('cu-001');
      expect(r.status).toBe(ContentUpdateStatus.REVIEW);
    });

    it('pending 항목 있으면 → BadRequest', async () => {
      const inProgress = makeUpdate({ status: ContentUpdateStatus.IN_PROGRESS });
      const { svc } = build(inProgress);
      await expect(svc.submitForReview('cu-001')).rejects.toThrow(BadRequestException);
    });

    it('in_progress 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // REQUESTED
      await expect(svc.submitForReview('cu-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('review', () => {
    it('review → approved', async () => {
      const { svc } = build(makeUpdate({ status: ContentUpdateStatus.REVIEW }));
      const r = await svc.review('cu-001', {
        reviewedBy: '3D팀장 김검토', result: 'approved', comment: '품질 만족',
      });
      expect(r.status).toBe(ContentUpdateStatus.APPROVED);
      expect(r.reviewHistory).toHaveLength(1);
      expect(r.reviewHistory[0].result).toBe('approved');
    });

    it('review → rejected', async () => {
      const { svc } = build(makeUpdate({ status: ContentUpdateStatus.REVIEW }));
      const r = await svc.review('cu-001', {
        reviewedBy: '3D팀장', result: 'rejected', comment: '품질 기준 미달',
      });
      expect(r.status).toBe(ContentUpdateStatus.REJECTED);
    });

    it('revision_needed → back to in_progress', async () => {
      const { svc } = build(makeUpdate({ status: ContentUpdateStatus.REVIEW }));
      const r = await svc.review('cu-001', {
        reviewedBy: '3D팀장', result: 'revision_needed', comment: '색상 수정 필요',
      });
      expect(r.status).toBe(ContentUpdateStatus.IN_PROGRESS);
      expect(r.reviewHistory).toHaveLength(1);
    });

    it('review 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // REQUESTED
      await expect(svc.review('cu-001', {
        reviewedBy: '팀장', result: 'approved', comment: '좋음',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deploy', () => {
    it('approved → deployed', async () => {
      const approved = makeUpdate({ status: ContentUpdateStatus.APPROVED });
      const { svc } = build(approved);
      const r = await svc.deploy('cu-001', { deployedBy: '기술팀 박배포' });
      expect(r.status).toBe(ContentUpdateStatus.DEPLOYED);
      expect(r.deployedBy).toBe('기술팀 박배포');
      expect(r.deployedAt).toBeTruthy();
    });

    it('approved 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // REQUESTED
      await expect(svc.deploy('cu-001', { deployedBy: '박배포' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('REQUESTED 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('cu-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('APPROVED 상태 삭제 → BadRequest', async () => {
      const approved = makeUpdate({ status: ContentUpdateStatus.APPROVED });
      const { svc } = build(approved);
      await expect(svc.remove('cu-001')).rejects.toThrow(BadRequestException);
    });

    it('DEPLOYED 상태 삭제 → BadRequest', async () => {
      const deployed = makeUpdate({ status: ContentUpdateStatus.DEPLOYED });
      const { svc } = build(deployed);
      await expect(svc.remove('cu-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로', () => {
    it('requested → in_progress → (항목 완료) → review → approved → deployed', async () => {
      // 1. → IN_PROGRESS
      const repo1 = makeRepo(makeUpdate()) as any;
      const svc1 = new ContentUpdatesService(repo1);
      const inProgress = await svc1.startWork('cu-001');
      expect(inProgress.status).toBe(ContentUpdateStatus.IN_PROGRESS);

      // 2. 항목 완료 처리
      const inProgressState = makeUpdate({ status: ContentUpdateStatus.IN_PROGRESS });
      const repo2 = makeRepo(inProgressState) as any;
      const svc2 = new ContentUpdatesService(repo2);
      const afterItem = await svc2.updateItemStatus('cu-001', 'item-001', { status: 'completed' });
      expect(afterItem.completedItems).toBe(1);

      // 3. → REVIEW (모든 항목 완료)
      const allDone = makeUpdate({
        status: ContentUpdateStatus.IN_PROGRESS,
        targetItems: makeTargetItems().map(i => ({ ...i, status: 'completed' as const })),
      });
      const repo3 = makeRepo(allDone) as any;
      const svc3 = new ContentUpdatesService(repo3);
      const review = await svc3.submitForReview('cu-001');
      expect(review.status).toBe(ContentUpdateStatus.REVIEW);

      // 4. → APPROVED
      const reviewState = makeUpdate({ status: ContentUpdateStatus.REVIEW });
      const repo4 = makeRepo(reviewState) as any;
      const svc4 = new ContentUpdatesService(repo4);
      const approved = await svc4.review('cu-001', {
        reviewedBy: '3D팀장', result: 'approved', comment: '겨울 테마 훌륭합니다.',
      });
      expect(approved.status).toBe(ContentUpdateStatus.APPROVED);

      // 5. → DEPLOYED
      const approvedState = makeUpdate({ status: ContentUpdateStatus.APPROVED });
      const repo5 = makeRepo(approvedState) as any;
      const svc5 = new ContentUpdatesService(repo5);
      const deployed = await svc5.deploy('cu-001', { deployedBy: '기술팀 박배포' });
      expect(deployed.status).toBe(ContentUpdateStatus.DEPLOYED);
    });

    it('revision_needed → in_progress → review → approved 재시도 흐름', async () => {
      // 1차 검토 → revision_needed
      const reviewState = makeUpdate({ status: ContentUpdateStatus.REVIEW });
      const repo1 = makeRepo(reviewState) as any;
      const svc1 = new ContentUpdatesService(repo1);
      const backToProgress = await svc1.review('cu-001', {
        reviewedBy: '팀장', result: 'revision_needed', comment: '색상 조정 필요',
      });
      expect(backToProgress.status).toBe(ContentUpdateStatus.IN_PROGRESS);
      expect(backToProgress.reviewHistory).toHaveLength(1);

      // 수정 후 재제출 → approved
      const allDone = makeUpdate({
        status: ContentUpdateStatus.IN_PROGRESS,
        reviewHistory: backToProgress.reviewHistory,
        targetItems: makeTargetItems().map(i => ({ ...i, status: 'completed' as const })),
      });
      const repo2 = makeRepo(allDone) as any;
      const svc2 = new ContentUpdatesService(repo2);
      const reReview = await svc2.submitForReview('cu-001');
      expect(reReview.status).toBe(ContentUpdateStatus.REVIEW);
    });
  });
});
