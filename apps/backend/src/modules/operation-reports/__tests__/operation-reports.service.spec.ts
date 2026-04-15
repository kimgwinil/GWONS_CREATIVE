/**
 * GWONS_CREATIVE — OperationReportsService Unit Tests
 * Phase 5 기획팀: 종합 운영 현황 리포트
 * drafting → in_review → published → acknowledged
 */
import { OperationReportsService } from '../operation-reports.service';
import {
  OperationReport, ReportStatus, ReportPeriod,
  OperationMetric, Phase5DeliverableSummary, OperationIssue, NextPeriodPlan,
} from '../entities/operation-report.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makeMetrics = (): OperationMetric[] => [
  {
    metricName: '월 관람객 수', category: 'visitor',
    value: 12500, unit: '명', target: 10000,
    achievementRate: 125, trend: 'up',
    note: '홍보 효과로 목표 초과 달성',
  },
  {
    metricName: '시스템 가동률', category: 'system',
    value: 99.2, unit: '%', target: 99.5,
    achievementRate: 99.7, trend: 'stable',
  },
  {
    metricName: '콘텐츠 업데이트 건수', category: 'content',
    value: 5, unit: '건', target: 4,
    achievementRate: 125, trend: 'up',
  },
];

const makeDeliverableSummaries = (): Phase5DeliverableSummary[] => [
  {
    deliverableType: 'operation_guide',
    totalCount: 3, completedCount: 2, inProgressCount: 1, issueCount: 0,
    highlights: '운영 가이드 v1.0 배포 완료',
  },
  {
    deliverableType: 'maintenance_contract',
    totalCount: 2, completedCount: 2, inProgressCount: 0, issueCount: 0,
    highlights: '연간 유지보수 계약 체결 완료',
  },
  {
    deliverableType: 'content_update',
    totalCount: 5, completedCount: 4, inProgressCount: 1, issueCount: 0,
    highlights: '시즌 콘텐츠 업데이트 진행 중',
  },
];

const makeIssues = (): OperationIssue[] => [
  {
    issueId: 'issue-001', severity: 'minor', category: 'system',
    description: '미디어 서버 간헐적 응답 지연 (5초 이내)',
    status: 'resolved', resolution: '네트워크 설정 최적화 완료',
    reportedAt: '2026-11-05T10:00:00Z',
  },
];

const makeNextPlans = (): NextPeriodPlan[] => [
  {
    planItem: '12월 시즌 콘텐츠 업데이트', responsibleTeam: '3D/2D팀',
    targetDate: '2026-12-01', priority: 'high',
  },
  {
    planItem: '연간 유지보수 정기 점검', responsibleTeam: '조달팀',
    targetDate: '2026-12-15', priority: 'medium',
  },
];

const makeReport = (overrides: Partial<OperationReport> = {}): OperationReport => ({
  id: 'or-001',
  title: '전시관 A동 11월 운영 현황 리포트',
  executiveSummary: '2026년 11월 운영 결과 종합 보고입니다.',
  status: ReportStatus.DRAFTING,
  reportPeriod: ReportPeriod.MONTHLY,
  periodStart: new Date('2026-11-01'),
  periodEnd: new Date('2026-11-30'),
  metrics: makeMetrics(),
  deliverableSummaries: makeDeliverableSummaries(),
  issues: makeIssues(),
  nextPeriodPlans: makeNextPlans(),
  version: 1,
  author: '기획팀 최운영',
  publishedBy: null as any,
  publishedAt: null as any,
  acknowledgedBy: null as any,
  acknowledgedAt: null as any,
  clientFeedback: null as any,
  internalNotes: null as any,
  projectId: 'proj-001',
  project: null as any,
  createdAt: new Date('2026-12-01T10:00:00Z'),
  updatedAt: new Date('2026-12-01T10:00:00Z'),
  ...overrides,
});

const makeRepo = (item: OperationReport | null = makeReport()) => ({
  findOne: jest.fn().mockResolvedValue(item),
  find:    jest.fn().mockResolvedValue(item ? [item] : []),
  count:   jest.fn().mockResolvedValue(1),
  create:  jest.fn().mockImplementation((d: any) => ({ ...makeReport(), ...d })),
  save:    jest.fn().mockImplementation((e: any) => Promise.resolve(e)),
  remove:  jest.fn().mockResolvedValue(undefined),
});

const build = (item: OperationReport | null = makeReport()) => {
  const repo = makeRepo(item) as any;
  return { svc: new OperationReportsService(repo), repo };
};

describe('OperationReportsService', () => {

  describe('findOne', () => {
    it('운영 리포트 반환', async () => {
      const { svc } = build();
      const r = await svc.findOne('or-001');
      expect(r.reportPeriod).toBe(ReportPeriod.MONTHLY);
      expect(r.metrics).toHaveLength(3);
      expect(r.deliverableSummaries).toHaveLength(3);
    });

    it('없는 ID → NotFoundException', async () => {
      const { svc } = build(null);
      await expect(svc.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('DRAFTING 상태로 생성, version=1', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '12월 운영 리포트',
        reportPeriod: ReportPeriod.MONTHLY,
      });
      expect(r.status).toBe(ReportStatus.DRAFTING);
      expect(r.version).toBe(1);
      expect(r.metrics).toEqual([]);
    });

    it('metrics/issues/plans 초기값 설정', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '분기 리포트',
        reportPeriod: ReportPeriod.QUARTERLY,
        metrics: makeMetrics(),
        issues: makeIssues(),
      });
      expect(r.metrics).toHaveLength(3);
      expect(r.issues).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('DRAFTING 상태에서 수정 가능, version 증가', async () => {
      const { svc } = build();
      const r = await svc.update('or-001', { title: '수정된 11월 리포트' });
      expect(r.title).toBe('수정된 11월 리포트');
      expect(r.version).toBe(2);
    });

    it('IN_REVIEW 상태에서 수정 가능', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc } = build(inReview);
      const r = await svc.update('or-001', { executiveSummary: '수정된 요약' });
      expect(r.version).toBe(2);
    });

    it('PUBLISHED 상태에서 수정 → BadRequest', async () => {
      const published = makeReport({ status: ReportStatus.PUBLISHED });
      const { svc } = build(published);
      await expect(svc.update('or-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });

    it('ACKNOWLEDGED 상태에서 수정 → BadRequest', async () => {
      const acknowledged = makeReport({ status: ReportStatus.ACKNOWLEDGED });
      const { svc } = build(acknowledged);
      await expect(svc.update('or-001', { title: '변경' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForReview', () => {
    it('drafting → in_review', async () => {
      const { svc } = build();
      const r = await svc.submitForReview('or-001');
      expect(r.status).toBe(ReportStatus.IN_REVIEW);
    });

    it('metrics 없으면 → BadRequest', async () => {
      const noMetrics = makeReport({ metrics: [] });
      const { svc } = build(noMetrics);
      await expect(svc.submitForReview('or-001')).rejects.toThrow(BadRequestException);
    });

    it('drafting 아닌 상태 → BadRequest', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc } = build(inReview);
      await expect(svc.submitForReview('or-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('in_review → published', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc } = build(inReview);
      const r = await svc.publish('or-001', { publishedBy: '기획팀장 박발행' });
      expect(r.status).toBe(ReportStatus.PUBLISHED);
      expect(r.publishedBy).toBe('기획팀장 박발행');
      expect(r.publishedAt).toBeTruthy();
    });

    it('critical 미해결 이슈 있어도 발행 가능 (경고만)', async () => {
      const withCritical = makeReport({
        status: ReportStatus.IN_REVIEW,
        issues: [
          {
            issueId: 'issue-c01', severity: 'critical', category: 'system',
            description: '전시관 메인 서버 다운', status: 'open',
            reportedAt: '2026-11-20T09:00:00Z',
          },
        ],
      });
      const { svc } = build(withCritical);
      const r = await svc.publish('or-001', { publishedBy: '박발행' });
      expect(r.status).toBe(ReportStatus.PUBLISHED);
      expect(r.internalNotes).toContain('Critical');
    });

    it('in_review 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.publish('or-001', { publishedBy: '박발행' })).rejects.toThrow(BadRequestException);
    });

    it('notes 제공 시 internalNotes에 추가', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc } = build(inReview);
      const r = await svc.publish('or-001', { publishedBy: '박발행', notes: '클라이언트 보고용' });
      expect(r.internalNotes).toContain('클라이언트 보고용');
    });
  });

  describe('acknowledge', () => {
    it('published → acknowledged', async () => {
      const published = makeReport({ status: ReportStatus.PUBLISHED });
      const { svc } = build(published);
      const r = await svc.acknowledge('or-001', {
        acknowledgedBy: '고객사 김대표',
        clientFeedback: '훌륭한 운영 성과입니다.',
      });
      expect(r.status).toBe(ReportStatus.ACKNOWLEDGED);
      expect(r.acknowledgedBy).toBe('고객사 김대표');
      expect(r.acknowledgedAt).toBeTruthy();
      expect(r.clientFeedback).toBe('훌륭한 운영 성과입니다.');
    });

    it('clientFeedback 없이도 확인 가능', async () => {
      const published = makeReport({ status: ReportStatus.PUBLISHED });
      const { svc } = build(published);
      const r = await svc.acknowledge('or-001', { acknowledgedBy: '김대표' });
      expect(r.status).toBe(ReportStatus.ACKNOWLEDGED);
    });

    it('published 아닌 상태 → BadRequest', async () => {
      const { svc } = build();  // DRAFTING
      await expect(svc.acknowledge('or-001', { acknowledgedBy: '김대표' })).rejects.toThrow(BadRequestException);
    });

    it('in_review 상태 → BadRequest', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc } = build(inReview);
      await expect(svc.acknowledge('or-001', { acknowledgedBy: '김대표' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('DRAFTING 상태 삭제 가능', async () => {
      const { svc, repo } = build();
      await svc.remove('or-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('IN_REVIEW 상태 삭제 가능', async () => {
      const inReview = makeReport({ status: ReportStatus.IN_REVIEW });
      const { svc, repo } = build(inReview);
      await svc.remove('or-001');
      expect(repo.remove).toHaveBeenCalled();
    });

    it('PUBLISHED 상태 삭제 → BadRequest', async () => {
      const published = makeReport({ status: ReportStatus.PUBLISHED });
      const { svc } = build(published);
      await expect(svc.remove('or-001')).rejects.toThrow(BadRequestException);
    });

    it('ACKNOWLEDGED 상태 삭제 → BadRequest', async () => {
      const acknowledged = makeReport({ status: ReportStatus.ACKNOWLEDGED });
      const { svc } = build(acknowledged);
      await expect(svc.remove('or-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('전체 워크플로', () => {
    it('drafting → in_review → published → acknowledged', async () => {
      // 1. → IN_REVIEW
      const draftRepo = makeRepo(makeReport()) as any;
      const draftSvc = new OperationReportsService(draftRepo);
      const inReview = await draftSvc.submitForReview('or-001');
      expect(inReview.status).toBe(ReportStatus.IN_REVIEW);

      // 2. → PUBLISHED
      const reviewRepo = makeRepo(makeReport({ status: ReportStatus.IN_REVIEW })) as any;
      const reviewSvc = new OperationReportsService(reviewRepo);
      const published = await reviewSvc.publish('or-001', { publishedBy: '팀장 김발행' });
      expect(published.status).toBe(ReportStatus.PUBLISHED);
      expect(published.publishedBy).toBe('팀장 김발행');

      // 3. → ACKNOWLEDGED
      const pubRepo = makeRepo(makeReport({ status: ReportStatus.PUBLISHED })) as any;
      const pubSvc = new OperationReportsService(pubRepo);
      const acked = await pubSvc.acknowledge('or-001', {
        acknowledgedBy: '고객사 오너 이대표',
        clientFeedback: '11월 운영 결과 확인했습니다. 매우 만족스럽습니다.',
      });
      expect(acked.status).toBe(ReportStatus.ACKNOWLEDGED);
      expect(acked.clientFeedback).toContain('만족');
    });

    it('수정(update) 후 검토 제출 흐름', async () => {
      // 1. 리포트 수정 (version 증가)
      const draftRepo = makeRepo(makeReport()) as any;
      const draftSvc = new OperationReportsService(draftRepo);
      const updated = await draftSvc.update('or-001', {
        executiveSummary: '수정된 종합 요약',
        nextPeriodPlans: makeNextPlans(),
      });
      expect(updated.version).toBe(2);

      // 2. 검토 요청
      const draft2 = makeReport({ executiveSummary: '수정된 종합 요약', version: 2 });
      const repo2 = makeRepo(draft2) as any;
      const svc2 = new OperationReportsService(repo2);
      const inReview = await svc2.submitForReview('or-001');
      expect(inReview.status).toBe(ReportStatus.IN_REVIEW);
    });

    it('분기 리포트 생성 및 발행 흐름', async () => {
      // 분기 리포트 생성
      const quarterlyBase = makeReport({
        reportPeriod: ReportPeriod.QUARTERLY,
        title: '2026년 4분기 운영 종합 리포트',
      });
      const qRepo = makeRepo(quarterlyBase) as any;
      const qSvc = new OperationReportsService(qRepo);

      // 검토 요청
      const inReview = await qSvc.submitForReview('or-001');
      expect(inReview.status).toBe(ReportStatus.IN_REVIEW);

      // 발행
      const revRepo = makeRepo(makeReport({ status: ReportStatus.IN_REVIEW, reportPeriod: ReportPeriod.QUARTERLY })) as any;
      const revSvc = new OperationReportsService(revRepo);
      const published = await revSvc.publish('or-001', {
        publishedBy: '기획팀장', notes: '4분기 종합 보고서 발행',
      });
      expect(published.status).toBe(ReportStatus.PUBLISHED);
    });

    it('특별 보고서 (SPECIAL) 생성', async () => {
      const { svc } = build();
      const r = await svc.create({
        projectId: 'proj-001',
        title: '전시관 임시 폐쇄 특별 보고',
        reportPeriod: ReportPeriod.SPECIAL,
        author: '기획팀장 박특별',
        issues: [
          {
            issueId: 'si-001', severity: 'critical', category: 'safety',
            description: '안전 점검으로 인한 임시 폐쇄',
            status: 'resolved', resolution: '안전 기준 충족 확인 후 재개방',
            reportedAt: '2026-11-15T08:00:00Z',
          },
        ],
        metrics: makeMetrics(),
      });
      expect(r.reportPeriod).toBe(ReportPeriod.SPECIAL);
    });
  });
});
