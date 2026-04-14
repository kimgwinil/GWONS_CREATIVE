/**
 * GWONS_CREATIVE — CadDrawingsService Unit Tests
 * Phase 2 — 2D 디자인팀: CAD 도면 상태머신 검증
 * draft → in_review → approved → issued
 */
import { CadDrawingsService } from '../cad-drawings.service';
import { CadDrawing, DrawingStatus, DrawingDiscipline, DrawingType } from '../entities/cad-drawing.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── 모킹 헬퍼 ────────────────────────────────────────────────
const makeDrawing = (overrides: Partial<CadDrawing> = {}): CadDrawing => ({
  id: 'cd-001',
  drawingNo: 'A-001',
  title: '전시관 A동 1층 평면도',
  description: '메인 전시홀 평면도 1:100',
  discipline: DrawingDiscipline.ARCHITECTURAL,
  drawingType: DrawingType.PLAN,
  status: DrawingStatus.DRAFT,
  scale: '1:100',
  paperSize: 'A1',
  floorNumber: 1,
  fileUrl: 's3://bucket/drawings/A-001.dwg',
  pdfUrl: null as any,
  thumbnailUrl: null as any,
  currentRevision: 'A',
  revisionHistory: [
    { revisionNo: 'A', date: '2026-04-14T10:00:00Z', description: '초안 작성', revisedBy: '2D팀_이순신' },
  ],
  layers: [
    { name: 'WALL', color: '#000000', description: '벽체', isVisible: true },
    { name: 'DOOR', color: '#FF0000', description: '문', isVisible: true },
  ],
  drawnBy: '2D팀_이순신',
  checkedBy: null as any,
  approvedBy: null as any,
  approvedAt: null as any,
  issuedAt: null as any,
  basicDesignId: 'bd-001',
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-04-14T10:00:00Z'),
  updatedAt: new Date('2026-04-14T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: CadDrawing | null = makeDrawing()) => ({
  findOne:  jest.fn().mockResolvedValue(item),
  find:     jest.fn().mockResolvedValue(item ? [item] : []),
  count:    jest.fn().mockResolvedValue(1),
  create:   jest.fn().mockImplementation((d: any) => ({ ...makeDrawing(), ...d })),
  save:     jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:   jest.fn().mockResolvedValue(undefined),
});

const buildService = (item: CadDrawing | null = makeDrawing()) => {
  const repo = makeRepo(item) as any;
  const svc  = new CadDrawingsService(repo);
  return { svc, repo };
};

// ── 테스트 스위트 ────────────────────────────────────────────
describe('CadDrawingsService', () => {

  describe('findOne', () => {
    it('존재하는 도면을 반환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.findOne('cd-001');
      expect(result.drawingNo).toBe('A-001');
      expect(result.discipline).toBe(DrawingDiscipline.ARCHITECTURAL);
    });

    it('존재하지 않는 도면은 NotFoundException을 던져야 한다', async () => {
      const { svc } = buildService(null);
      await expect(svc.findOne('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 도면을 생성하고 초기 개정 이력(A)을 포함해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.create({
        projectId: 'proj-001',
        drawingNo: 'S-001',
        title: '구조 평면도',
        discipline: DrawingDiscipline.STRUCTURAL,
        drawingType: DrawingType.PLAN,
        drawnBy: '2D팀_강감찬',
      });
      expect(result.currentRevision).toBe('A');
      expect(result.revisionHistory).toHaveLength(1);
      expect(result.revisionHistory[0].revisionNo).toBe('A');
    });
  });

  describe('submitForReview', () => {
    it('초안 → 검토 중으로 전환해야 한다', async () => {
      const { svc } = buildService();
      const result = await svc.submitForReview('cd-001');
      expect(result.status).toBe(DrawingStatus.IN_REVIEW);
    });

    it('파일 URL이 없으면 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeDrawing({ fileUrl: null as any }));
      await expect(svc.submitForReview('cd-001')).rejects.toThrow(BadRequestException);
    });

    it('승인된 도면에서 검토 요청 시 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.APPROVED }));
      await expect(svc.submitForReview('cd-001')).rejects.toThrow(BadRequestException);
    });

    it('수정(REVISED) 상태에서도 검토 요청이 가능해야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.REVISED }));
      const result = await svc.submitForReview('cd-001');
      expect(result.status).toBe(DrawingStatus.IN_REVIEW);
    });
  });

  describe('approve', () => {
    it('검토 중 → 승인으로 전환하고 승인자를 기록해야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.IN_REVIEW }));
      const result = await svc.approve('cd-001', '기획팀_팀장');
      expect(result.status).toBe(DrawingStatus.APPROVED);
      expect(result.approvedBy).toBe('기획팀_팀장');
      expect(result.approvedAt).toBeDefined();
    });

    it('검토 중이 아닌 상태에서 승인 시 BadRequestException을 던져야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.DRAFT }));
      await expect(svc.approve('cd-001', '팀장')).rejects.toThrow(BadRequestException);
    });
  });

  describe('issue (시공용 발행)', () => {
    it('승인된 도면을 발행하고 개정 번호를 A → B로 증가시켜야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.APPROVED }));
      const result = await svc.issue('cd-001', {
        revisionDescription: '시공용 최종 발행',
        approvedBy: '프로젝트 매니저',
      });
      expect(result.status).toBe(DrawingStatus.ISSUED);
      expect(result.currentRevision).toBe('B');
      expect(result.revisionHistory).toHaveLength(2);
      expect(result.issuedAt).toBeDefined();
    });

    it('승인되지 않은 도면은 발행 불가해야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.IN_REVIEW }));
      await expect(
        svc.issue('cd-001', { revisionDescription: '발행 시도', approvedBy: '팀장' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('발행된 도면은 수정 불가해야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.ISSUED }));
      await expect(svc.update('cd-001', { title: '수정 시도' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('requestRevision', () => {
    it('수정 요청 시 REVISED 상태로 전환해야 한다', async () => {
      const { svc } = buildService(makeDrawing({ status: DrawingStatus.APPROVED }));
      const result = await svc.requestRevision('cd-001', '내력벽 위치 조정 필요');
      expect(result.status).toBe(DrawingStatus.REVISED);
    });
  });

  describe('remove', () => {
    it('도면을 삭제할 수 있어야 한다', async () => {
      const { svc, repo } = buildService();
      await svc.remove('cd-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('전체 상태 흐름 (draft → issued)', () => {
    it('draft → in_review → approved → issued 전환이 정상 작동해야 한다', async () => {
      const steps = [
        {
          status: DrawingStatus.DRAFT,
          action: (s: CadDrawingsService) => s.submitForReview('cd-001'),
          expected: DrawingStatus.IN_REVIEW,
        },
        {
          status: DrawingStatus.IN_REVIEW,
          action: (s: CadDrawingsService) => s.approve('cd-001', '팀장'),
          expected: DrawingStatus.APPROVED,
        },
        {
          status: DrawingStatus.APPROVED,
          action: (s: CadDrawingsService) => s.issue('cd-001', { revisionDescription: '발행', approvedBy: '팀장' }),
          expected: DrawingStatus.ISSUED,
        },
      ];

      for (const { status, action, expected } of steps) {
        const repo = makeRepo(makeDrawing({ status })) as any;
        const svc  = new CadDrawingsService(repo);
        const result = await action(svc);
        expect(result.status).toBe(expected);
      }
    });
  });
});
