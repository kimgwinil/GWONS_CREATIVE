/**
 * GWONS_CREATIVE — MaintenanceContractsService Unit Tests
 * Phase 5 조달팀: 유지보수 계약 지원
 * drafting → negotiating → signed → active → expired/terminated
 */
import { MaintenanceContractsService } from '../maintenance-contracts.service';
import {
  MaintenanceContract, ContractStatus, ContractType,
  MaintenanceScope, MaintenanceRecord,
} from '../entities/maintenance-contract.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeScope = (): MaintenanceScope[] => [
  {
    itemId: 'scope-001', targetName: '인터랙티브 미디어 월', targetType: 'hardware',
    coverage: '부품 교체 제외 수리 대응', responseTime: '4시간 이내',
    visitCount: 4, includeParts: false, purchaseOrderRef: 'po-001',
  },
  {
    itemId: 'scope-002', targetName: '전시 관리 S/W', targetType: 'software',
    coverage: '버그 수정 + 연 2회 업데이트', responseTime: '24시간 이내',
    visitCount: 2, includeParts: true,
  },
];

const makeContract = (overrides: Partial<MaintenanceContract> = {}): MaintenanceContract => ({
  id: 'mc-001',
  title: '전시관 A동 통합 유지보수 계약',
  contractNo: 'MC-2026-001',
  description: 'H/W + S/W 통합 유지보수 1년 계약',
  status: ContractStatus.DRAFTING,
  contractType: ContractType.INTEGRATED,
  vendorName: '(주)유지보수코리아',
  vendorContact: '박담당 02-1234-5678',
  vendorEmail: 'support@maintain.co.kr',
  contractAmount: 24000000,
  currency: 'KRW',
  startDate: new Date('2026-10-01'),
  endDate: new Date('2027-09-30'),
  maintenanceScope: makeScope(),
  slaClauses: [
    { clauseId: 'sla-001', metric: '시스템 가동률', target: '99.5% 이상', penalty: '월 계약금 5% 차감' },
  ],
  maintenanceRecords: [],
  contractFileUrl: null as any,
  managedBy: '조달팀 이계약',
  signedAt: null as any,
  notes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-09-15T10:00:00Z'),
  updatedAt: new Date('2026-09-15T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: MaintenanceContract | null = makeContract()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeContract(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: MaintenanceContract | null = makeContract()) => {
  const repo = makeRepo(item) as any;
  return { svc: new MaintenanceContractsService(repo), repo };
};

describe('MaintenanceContractsService', () => {

  describe('findOne', () => {
    it('유지보수 계약 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('mc-001');
      expect(r.contractType).toBe(ContractType.INTEGRATED);
      expect(r.maintenanceScope).toHaveLength(2);
    });
    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('DRAFTING 상태로 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001', title: '신규 유지보수 계약',
        contractType: ContractType.HARDWARE, vendorName: '(주)하드웨어서비스',
      });
      expect(r.status).toBe(ContractStatus.DRAFTING);
      expect(r.maintenanceRecords).toEqual([]);
    });
  });

  describe('update', () => {
    it('DRAFTING 상태에서 수정 가능', async () => {
      const { svc } = build();
      const r = await svc.update('mc-001', { contractAmount: 30000000 });
      expect(r.contractAmount).toBe(30000000);
    });

    it('EXPIRED 상태에서 수정 → BadRequest', async () => {
      const expired = makeContract({ status: ContractStatus.EXPIRED });
      const { svc } = build(expired);
      await expect(svc.update('mc-001', { contractAmount: 1 })).rejects.toThrow(BadRequestException);
    });

    it('TERMINATED 상태에서 수정 → BadRequest', async () => {
      const terminated = makeContract({ status: ContractStatus.TERMINATED });
      const { svc } = build(terminated);
      await expect(svc.update('mc-001', { notes: '수정' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('startNegotiation', () => {
    it('drafting → negotiating', async () => {
      const { svc } = build();
      const r = await svc.startNegotiation('mc-001');
      expect(r.status).toBe(ContractStatus.NEGOTIATING);
    });

    it('maintenanceScope 없으면 → BadRequest', async () => {
      const noScope = makeContract({ maintenanceScope: [] });
      const { svc } = build(noScope);
      await expect(svc.startNegotiation('mc-001')).rejects.toThrow(BadRequestException);
    });

    it('drafting 아닌 상태 → BadRequest', async () => {
      const negotiating = makeContract({ status: ContractStatus.NEGOTIATING });
      const { svc } = build(negotiating);
      await expect(svc.startNegotiation('mc-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('sign', () => {
    it('negotiating → signed', async () => {
      const negotiating = makeContract({ status: ContractStatus.NEGOTIATING });
      const { svc } = build(negotiating);
      const r = await svc.sign('mc-001', { signedBy: '조달팀장 이체결', contractFileUrl: 'https://cdn/mc-001.pdf' });
      expect(r.status).toBe(ContractStatus.SIGNED);
      expect(r.signedAt).toBeTruthy();
      expect(r.contractFileUrl).toBe('https://cdn/mc-001.pdf');
    });

    it('날짜 미설정 → BadRequest', async () => {
      const noDate = makeContract({ status: ContractStatus.NEGOTIATING, startDate: null as any, endDate: null as any });
      const { svc } = build(noDate);
      await expect(svc.sign('mc-001', { signedBy: '이체결' })).rejects.toThrow(BadRequestException);
    });

    it('negotiating 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.sign('mc-001', { signedBy: '이체결' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('activate', () => {
    it('signed → active', async () => {
      const signed = makeContract({ status: ContractStatus.SIGNED });
      const { svc } = build(signed);
      const r = await svc.activate('mc-001');
      expect(r.status).toBe(ContractStatus.ACTIVE);
    });

    it('signed 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.activate('mc-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addRecord', () => {
    const activeContract = makeContract({ status: ContractStatus.ACTIVE });

    it('유지보수 이력 추가', async () => {
      const { svc } = build(activeContract);
      const r = await svc.addRecord('mc-001', {
        visitedBy: '(주)유지보수코리아 김기사',
        targetItems: ['인터랙티브 미디어 월', '제어 서버'],
        workType: 'inspection',
        description: '정기 점검: 디스플레이 상태 확인 및 필터 청소',
        result: 'completed',
        nextScheduledDate: '2027-01-15',
      });
      expect(r.maintenanceRecords).toHaveLength(1);
      expect(r.maintenanceRecords[0].workType).toBe('inspection');
      expect(r.maintenanceRecords[0].recordId).toBeTruthy();
    });

    it('active 아닌 상태에서 이력 추가 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.addRecord('mc-001', {
        visitedBy: '기사', targetItems: [], workType: 'inspection',
        description: '점검', result: 'completed',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('expire', () => {
    it('active → expired', async () => {
      const active = makeContract({ status: ContractStatus.ACTIVE });
      const { svc } = build(active);
      const r = await svc.expire('mc-001');
      expect(r.status).toBe(ContractStatus.EXPIRED);
    });

    it('active 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.expire('mc-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('terminate', () => {
    it('active → terminated (해지)', async () => {
      const active = makeContract({ status: ContractStatus.ACTIVE });
      const { svc } = build(active);
      const r = await svc.terminate('mc-001', '벤더사 계약 위반');
      expect(r.status).toBe(ContractStatus.TERMINATED);
      expect(r.notes).toContain('벤더사 계약 위반');
    });

    it('이미 terminated → BadRequest', async () => {
      const terminated = makeContract({ status: ContractStatus.TERMINATED });
      const { svc } = build(terminated);
      await expect(svc.terminate('mc-001', '사유')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('DRAFTING 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('mc-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('SIGNED 상태 삭제 → BadRequest', async () => {
      const signed = makeContract({ status: ContractStatus.SIGNED });
      const { svc } = build(signed);
      await expect(svc.remove('mc-001')).rejects.toThrow(BadRequestException);
    });

    it('ACTIVE 상태 삭제 → BadRequest', async () => {
      const active = makeContract({ status: ContractStatus.ACTIVE });
      const { svc } = build(active);
      await expect(svc.remove('mc-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로', () => {
    it('drafting → negotiating → signed → active → expired 전체 흐름', async () => {
      // 1. → NEGOTIATING
      const repo1 = makeRepo(makeContract()) as any;
      const svc1 = new MaintenanceContractsService(repo1);
      const negotiating = await svc1.startNegotiation('mc-001');
      expect(negotiating.status).toBe(ContractStatus.NEGOTIATING);

      // 2. → SIGNED
      const negState = makeContract({ status: ContractStatus.NEGOTIATING });
      const repo2 = makeRepo(negState) as any;
      const svc2 = new MaintenanceContractsService(repo2);
      const signed = await svc2.sign('mc-001', { signedBy: '조달팀장', contractFileUrl: 'https://cdn/mc.pdf' });
      expect(signed.status).toBe(ContractStatus.SIGNED);

      // 3. → ACTIVE
      const signedState = makeContract({ status: ContractStatus.SIGNED });
      const repo3 = makeRepo(signedState) as any;
      const svc3 = new MaintenanceContractsService(repo3);
      const active = await svc3.activate('mc-001');
      expect(active.status).toBe(ContractStatus.ACTIVE);

      // 4. 이력 추가
      const activeState = makeContract({ status: ContractStatus.ACTIVE });
      const repo4 = makeRepo(activeState) as any;
      const svc4 = new MaintenanceContractsService(repo4);
      const withRecord = await svc4.addRecord('mc-001', {
        visitedBy: '김기사', targetItems: ['미디어 월'],
        workType: 'inspection', description: '정기 점검', result: 'completed',
      });
      expect(withRecord.maintenanceRecords).toHaveLength(1);

      // 5. → EXPIRED
      const repo5 = makeRepo(activeState) as any;
      const svc5 = new MaintenanceContractsService(repo5);
      const expired = await svc5.expire('mc-001');
      expect(expired.status).toBe(ContractStatus.EXPIRED);
    });
  });
});
