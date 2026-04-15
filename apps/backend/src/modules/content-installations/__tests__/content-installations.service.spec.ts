/**
 * GWONS_CREATIVE — ContentInstallationsService Unit Tests
 * Phase 4 소프트웨어팀: 콘텐츠 설치 + 시스템 연동
 * pending → in_progress → integration → testing → completed
 */
import { ContentInstallationsService } from '../content-installations.service';
import {
  ContentInstallation, InstallationStatus, ContentType, InstallationItem,
} from '../entities/content-installation.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeItems = (): InstallationItem[] => [
  { itemId: 'item-001', contentName: '인터랙티브 미디어 월 콘텐츠', contentType: ContentType.INTERACTIVE,
    targetDevice: 'MediaWall-01', targetZone: 'Zone-A', version: '1.0.0',
    installedBy: '소프트웨어팀', plannedDate: '2026-08-01', status: 'pending' },
  { itemId: 'item-002', contentName: '전시관 제어 시스템', contentType: ContentType.CONTROL_SYSTEM,
    targetDevice: 'ControlServer-01', targetZone: 'Utility', version: '2.1.0',
    installedBy: '소프트웨어팀', plannedDate: '2026-08-01', status: 'pending' },
  { itemId: 'item-003', contentName: '입구 키오스크 S/W', contentType: ContentType.KIOSK,
    targetDevice: 'Kiosk-01', targetZone: 'Entrance', version: '3.0.1',
    installedBy: '소프트웨어팀', plannedDate: '2026-08-02', status: 'pending' },
];

const makeInstallation = (overrides: Partial<ContentInstallation> = {}): ContentInstallation => ({
  id: 'ci-001',
  title: '전시관 A동 콘텐츠 설치 패키지',
  description: '메인 콘텐츠 + 제어시스템 설치',
  status: InstallationStatus.PENDING,
  installationItems: makeItems(),
  integrationTests: [],
  techIssues: [],
  totalItems: 3,
  installedItems: 0,
  failedItems: 0,
  plannedStartDate: new Date('2026-08-01'),
  plannedEndDate: new Date('2026-08-15'),
  actualEndDate: null as any,
  installationLead: '소프트웨어팀장 박기술',
  softwareOrderId: 'so-001',
  constructionPlanId: 'cp-001',
  notes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-05-01T10:00:00Z'),
  updatedAt: new Date('2026-05-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: ContentInstallation | null = makeInstallation()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeInstallation(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: ContentInstallation | null = makeInstallation()) => {
  const repo = makeRepo(item) as any;
  return { svc: new ContentInstallationsService(repo), repo };
};

describe('ContentInstallationsService', () => {

  describe('findOne', () => {
    it('설치 패키지 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('ci-001');
      expect(r.totalItems).toBe(3);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('PENDING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', title: '신규 설치 패키지',
        installationItems: makeItems(),
      });
      expect(r.status).toBe(InstallationStatus.PENDING);
      expect(r.totalItems).toBe(3);
    });
  });

  describe('startInstallation', () => {
    it('pending → in_progress', async () => {
      const { svc } = build();
      const r = await svc.startInstallation('ci-001');
      expect(r.status).toBe(InstallationStatus.IN_PROGRESS);
    });
    it('items 없으면 BadRequestException', async () => {
      const { svc } = build(makeInstallation({ installationItems: [] }));
      await expect(svc.startInstallation('ci-001')).rejects.toThrow(BadRequestException);
    });
    it('pending 이외 상태 → BadRequestException', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.IN_PROGRESS }));
      await expect(svc.startInstallation('ci-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateItem', () => {
    it('설치 항목 installed 처리', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.IN_PROGRESS }));
      const r = await svc.updateItem('ci-001', 'item-001', {
        status: 'installed', actualDate: '2026-08-01',
      });
      expect(r.installedItems).toBe(1);
      const item = r.installationItems.find(i => i.itemId === 'item-001');
      expect(item?.status).toBe('installed');
    });

    it('실패 항목 발생 시 FAILED 상태 전환', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.IN_PROGRESS }));
      const r = await svc.updateItem('ci-001', 'item-001', {
        status: 'failed', errorLog: '드라이버 충돌',
      });
      expect(r.status).toBe(InstallationStatus.FAILED);
      expect(r.failedItems).toBe(1);
    });

    it('모든 항목 설치 완료 시 INTEGRATION 전환', async () => {
      const allInstalledItems: InstallationItem[] = makeItems().map(i =>
        i.itemId !== 'item-001' ? { ...i, status: 'installed' as any } : i,
      );
      const { svc } = build(makeInstallation({ status: InstallationStatus.IN_PROGRESS, installationItems: allInstalledItems }));
      const r = await svc.updateItem('ci-001', 'item-001', {
        status: 'installed', actualDate: '2026-08-02',
      });
      expect(r.status).toBe(InstallationStatus.INTEGRATION);
    });

    it('없는 itemId → BadRequestException', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.IN_PROGRESS }));
      await expect(svc.updateItem('ci-001', 'invalid', { status: 'installed' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('addIntegrationTest', () => {
    it('연동 테스트 추가 후 TESTING 전환', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.INTEGRATION }));
      const r = await svc.addIntegrationTest('ci-001', {
        testName: '전시 제어 시스템 연동 테스트',
        targetSystems: ['ControlServer-01', 'MediaWall-01'],
        testedBy: '소프트웨어팀장',
        result: 'pass',
      });
      expect(r.integrationTests).toHaveLength(1);
      expect(r.status).toBe(InstallationStatus.TESTING);
    });

    it('연동 테스트 실패 시 상태 유지 (INTEGRATION)', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.INTEGRATION }));
      const r = await svc.addIntegrationTest('ci-001', {
        testName: 'API 연동 테스트',
        targetSystems: ['API-Server'],
        testedBy: '개발자',
        result: 'fail',
        errorDetails: 'CORS 오류',
      });
      expect(r.status).toBe(InstallationStatus.INTEGRATION);
    });

    it('integration 이외 상태 → BadRequestException', async () => {
      const { svc } = build();
      await expect(svc.addIntegrationTest('ci-001', {
        testName: 'test', targetSystems: [], testedBy: 'dev', result: 'pass',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('testing → completed', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.TESTING }));
      const r = await svc.complete('ci-001');
      expect(r.status).toBe(InstallationStatus.COMPLETED);
      expect(r.actualEndDate).toBeDefined();
    });

    it('critical 이슈 미해결 시 BadRequestException', async () => {
      const { svc } = build(makeInstallation({
        status: InstallationStatus.TESTING,
        techIssues: [{ issueId: 'iss-001', severity: 'critical', title: '긴급 버그',
          description: '시스템 충돌', affectedItems: [], reportedAt: '', reportedBy: '', status: 'open' }],
      }));
      await expect(svc.complete('ci-001')).rejects.toThrow(BadRequestException);
    });

    it('pending 상태 완료 불가', async () => {
      const { svc } = build();
      await expect(svc.complete('ci-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('pending 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('ci-001');
      expect(repo.remove).toHaveBeenCalledTimes(1);
    });
    it('completed 상태 삭제 불가', async () => {
      const { svc } = build(makeInstallation({ status: InstallationStatus.COMPLETED }));
      await expect(svc.remove('ci-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 흐름', () => {
    it('pending → in_progress → integration → testing → completed', async () => {
      const flow = [
        { status: InstallationStatus.PENDING,      action: (s: ContentInstallationsService) => s.startInstallation('ci-001'),     expected: InstallationStatus.IN_PROGRESS },
        { status: InstallationStatus.INTEGRATION,  action: (s: ContentInstallationsService) => s.addIntegrationTest('ci-001', { testName: 'T', targetSystems: [], testedBy: 'dev', result: 'pass' }), expected: InstallationStatus.TESTING },
        { status: InstallationStatus.TESTING,      action: (s: ContentInstallationsService) => s.complete('ci-001'),              expected: InstallationStatus.COMPLETED },
      ];
      for (const { status, action, expected } of flow) {
        const repo = makeRepo(makeInstallation({ status })) as any;
        const r = await action(new ContentInstallationsService(repo));
        expect(r.status).toBe(expected);
      }
    });
  });
});
