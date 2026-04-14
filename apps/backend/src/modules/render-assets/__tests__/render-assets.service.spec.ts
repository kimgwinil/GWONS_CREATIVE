/**
 * GWONS_CREATIVE — RenderAssetsService Unit Tests
 * Phase 2 — 3D 디자인팀: 렌더링 에셋 상태머신 검증
 * modeling → rendering → review → approved → final
 */
import { RenderAssetsService } from '../render-assets.service';
import { RenderAsset, RenderAssetStatus, RenderAssetType, RenderViewType } from '../entities/render-asset.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── 모킹 헬퍼 ────────────────────────────────────────────────
const makeAsset = (overrides: Partial<RenderAsset> = {}): RenderAsset => ({
  id: 'ra-001',
  title: '전시관 A동 3D 렌더링',
  description: '메인 전시 공간 조감도',
  assetType: RenderAssetType.RENDER_IMG,
  viewType: RenderViewType.BIRDS_EYE,
  status: RenderAssetStatus.MODELING,
  sourceFileUrl: 's3://bucket/source/model.blend',
  outputFileUrl: null as any,
  thumbnailUrl: null as any,
  fileFormat: 'blend',
  fileSizeBytes: 52428800, // 50MB
  lodLevel: 'lod2' as any,
  renderSettings: { resolution: '4K', samples: 512, engine: 'Cycles' },
  targetZoneId: 'zone-01',
  version: 1,
  createdBy: '3D팀_홍길동',
  reviewNotes: null as any,
  basicDesignId: 'bd-001',
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: RenderAsset | null = makeAsset()) => ({
  findOne:  jest.fn().mockResolvedValue(item),
  find:     jest.fn().mockResolvedValue(item ? [item] : []),
  count:    jest.fn().mockResolvedValue(1),
  create:   jest.fn().mockImplementation((d: any) => ({ ...makeAsset(), ...d })),
  save:     jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:   jest.fn().mockResolvedValue(undefined),
});

const buildService = (item: RenderAsset | null = makeAsset()) => {
  const repo = makeRepo(item) as any;
  const svc  = new RenderAssetsService(repo);
  return { svc, repo };
};

// ── 테스트 스위트 ────────────────────────────────────────────
describe('RenderAssetsService', () => {

  describe('findOne', () => {
    it('존재하는 렌더 에셋을 반환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.findOne('ra-001');
      expect(result.id).toBe('ra-001');
      expect(result.assetType).toBe(RenderAssetType.RENDER_IMG);
    });

    it('존재하지 않는 에셋은 NotFoundException을 던져야 한다', async () => {
      const { svc } = buildService(null);
      await expect(svc.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 렌더 에셋을 생성해야 한다 (초기 상태: modeling)', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        title: '신규 렌더',
        assetType: RenderAssetType.MODEL_3D,
        basicDesignId: 'bd-001',
      });
      expect(result.status).toBe(RenderAssetStatus.MODELING);
    });
  });

  describe('startRendering', () => {
    it('모델링 → 렌더링으로 전환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.startRendering('ra-001');
      expect(result.status).toBe(RenderAssetStatus.RENDERING);
    });

    it('모델링 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.RENDERING }));
      await expect(svc.startRendering('ra-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForReview', () => {
    it('렌더링 → 검토 요청으로 전환하고 outputFileUrl을 설정해야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.RENDERING }));
      const result = await svc.submitForReview(
        'ra-001',
        's3://bucket/output/render.png',
        's3://bucket/thumbs/render_thumb.jpg',
      );
      expect(result.status).toBe(RenderAssetStatus.REVIEW);
      expect(result.outputFileUrl).toBe('s3://bucket/output/render.png');
      expect(result.thumbnailUrl).toBe('s3://bucket/thumbs/render_thumb.jpg');
    });

    it('렌더링 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.MODELING }));
      await expect(
        svc.submitForReview('ra-001', 's3://bucket/output.png')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('검토 중 → 승인으로 전환해야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.REVIEW }));
      const result = await svc.approve('ra-001', '품질 기준 충족, 승인');
      expect(result.status).toBe(RenderAssetStatus.APPROVED);
      expect(result.reviewNotes).toBe('품질 기준 충족, 승인');
    });

    it('검토 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.MODELING }));
      await expect(svc.approve('ra-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('finalize', () => {
    it('승인 → 최종본 확정으로 전환해야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.APPROVED }));
      const result = await svc.finalize('ra-001');
      expect(result.status).toBe(RenderAssetStatus.FINAL);
    });

    it('승인 상태가 아니면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeAsset({ status: RenderAssetStatus.REVIEW }));
      await expect(svc.finalize('ra-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('파일 URL 갱신 시 버전이 1 증가해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.update('ra-001', {
        outputFileUrl: 's3://bucket/new/render_v2.png',
      });
      expect(result.version).toBe(2);
    });
  });

  describe('remove', () => {
    it('렌더 에셋을 삭제할 수 있어야 한다', async () => {
      const { svc, repo } = buildService();
      await svc.remove('ra-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('전체 상태 흐름 (modeling → final)', () => {
    it('5단계 상태 전환이 순서대로 동작해야 한다', async () => {
      const steps = [
        { status: RenderAssetStatus.MODELING,  action: (s: RenderAssetsService) => s.startRendering('ra-001'),                                    expected: RenderAssetStatus.RENDERING },
        { status: RenderAssetStatus.RENDERING, action: (s: RenderAssetsService) => s.submitForReview('ra-001', 's3://out.png'),                    expected: RenderAssetStatus.REVIEW },
        { status: RenderAssetStatus.REVIEW,    action: (s: RenderAssetsService) => s.approve('ra-001'),                                            expected: RenderAssetStatus.APPROVED },
        { status: RenderAssetStatus.APPROVED,  action: (s: RenderAssetsService) => s.finalize('ra-001'),                                           expected: RenderAssetStatus.FINAL },
      ];

      for (const { status, action, expected } of steps) {
        const repo = makeRepo(makeAsset({ status })) as any;
        const svc  = new RenderAssetsService(repo);
        const result = await action(svc);
        expect(result.status).toBe(expected);
      }
    });
  });
});
