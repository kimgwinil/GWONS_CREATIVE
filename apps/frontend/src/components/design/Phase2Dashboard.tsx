/**
 * GWONS_CREATIVE — Phase 2 Design Dashboard
 * 설계 단계 진행 현황 및 팀별 작업 관리
 * 기획팀(직렬) → 3D/2D/조달팀(병렬) → 통합 검토(합류) 흐름 시각화
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import {
  basicDesignsApi, detailDesignsApi, renderAssetsApi,
  cadDrawingsApi, marketResearchesApi, designReviewsApi,
  type BasicDesign, type RenderAsset, type CadDrawing,
  type MarketResearch, type DesignReview,
} from '../../api/design.api';

// ── 상태 뱃지 색상 맵 ─────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  // 공통
  draft:          'bg-gray-100 text-gray-700',
  in_review:      'bg-yellow-100 text-yellow-800',
  approved:       'bg-green-100 text-green-800',
  final:          'bg-blue-100 text-blue-800',
  rejected:       'bg-red-100 text-red-700',
  // 기본설계서
  distributed:    'bg-purple-100 text-purple-800',
  // 렌더
  modeling:       'bg-orange-100 text-orange-800',
  rendering:      'bg-amber-100 text-amber-800',
  review:         'bg-indigo-100 text-indigo-800',
  // CAD
  issued:         'bg-teal-100 text-teal-800',
  revised:        'bg-pink-100 text-pink-800',
  // 시장조사
  open:           'bg-sky-100 text-sky-800',
  completed:      'bg-emerald-100 text-emerald-800',
  reviewed:       'bg-violet-100 text-violet-800',
  // 설계 검토
  collecting:     'bg-slate-100 text-slate-700',
  client_review:  'bg-cyan-100 text-cyan-800',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '초안', in_review: '검토 중', approved: '승인', final: '최종',
  rejected: '반려', distributed: '배포 완료',
  modeling: '모델링', rendering: '렌더링', review: '검토 요청',
  issued: '발행', revised: '수정 중',
  open: '조사 중', completed: '완료', reviewed: '기획팀 검토 완료',
  collecting: '수집 중', client_review: '클라이언트 검토',
};

// ── 상태 뱃지 컴포넌트 ────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {STATUS_LABELS[status] ?? status}
  </span>
);

// ── 팀 레이블 ────────────────────────────────────────────────
const TEAM_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  planning:    { label: '기획팀',     color: 'border-blue-400',   icon: '📋' },
  design3d:    { label: '3D 디자인팀', color: 'border-purple-400', icon: '🎨' },
  design2d:    { label: '2D 디자인팀', color: 'border-green-400',  icon: '📐' },
  procurement: { label: '조달팀',     color: 'border-orange-400', icon: '🔍' },
  review:      { label: '통합 검토',  color: 'border-red-400',    icon: '✅' },
};

// ── 카드 컴포넌트 ────────────────────────────────────────────
interface CardProps {
  title: string;
  team: keyof typeof TEAM_LABELS;
  children: React.ReactNode;
  count?: number;
}

const TeamCard: React.FC<CardProps> = ({ title, team, children, count }) => {
  const t = TEAM_LABELS[team];
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${t.color} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{t.icon}</span>
            <div>
              <p className="text-xs font-medium text-gray-500">{t.label}</p>
              <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            </div>
          </div>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
              {count}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
};

// ── 아이템 행 컴포넌트 ────────────────────────────────────────
const ItemRow: React.FC<{ title: string; subtitle?: string; status: string; meta?: string }> = ({
  title, subtitle, status, meta,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
    </div>
    <div className="ml-3 flex flex-col items-end gap-1">
      <StatusBadge status={status} />
      {meta && <span className="text-xs text-gray-400">{meta}</span>}
    </div>
  </div>
);

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center justify-between py-2">
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="ml-3 h-5 w-16 bg-gray-200 rounded-full" />
      </div>
    ))}
  </div>
);

// ── 워크플로우 진행 표시기 ─────────────────────────────────────
const WorkflowProgress: React.FC<{
  steps: { label: string; status: 'done' | 'active' | 'pending'; icon: string }[];
}> = ({ steps }) => (
  <div className="flex items-center gap-1 overflow-x-auto py-3 px-1">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className={`flex flex-col items-center min-w-[70px] ${
          step.status === 'done'   ? 'opacity-100' :
          step.status === 'active' ? 'opacity-100' :
                                     'opacity-40'
        }`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 ${
            step.status === 'done'   ? 'bg-green-500  border-green-500  text-white' :
            step.status === 'active' ? 'bg-blue-500   border-blue-500   text-white animate-pulse' :
                                       'bg-gray-100   border-gray-300   text-gray-400'
          }`}>
            {step.status === 'done' ? '✓' : step.icon}
          </div>
          <span className="text-xs mt-1 text-center text-gray-600 leading-tight">{step.label}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-0.5 min-w-[16px] mt-[-10px] ${
            step.status === 'done' ? 'bg-green-400' : 'bg-gray-200'
          }`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
interface Phase2DashboardProps {
  projectId: string;
}

export const Phase2Dashboard: React.FC<Phase2DashboardProps> = ({ projectId }) => {
  const pageParams = { limit: 5, direction: 'next' as const };

  // ── 기본설계서 ─────────────────────────────────────────────
  const {
    items: basicDesigns, loading: bdLoading, hasNextPage: bdHasNext, loadNext: bdLoadNext,
  } = useCursorPagination<BasicDesign>({
    fetchFn: (input) => basicDesignsApi.list({ ...input, projectId }),
    limit: 5,
  });

  // ── 3D 렌더 에셋 ──────────────────────────────────────────
  const {
    items: renderAssets, loading: raLoading, hasNextPage: raHasNext, loadNext: raLoadNext,
  } = useCursorPagination<RenderAsset>({
    fetchFn: (input) => renderAssetsApi.list({ ...input, projectId }),
    limit: 5,
  });

  // ── CAD 도면 ──────────────────────────────────────────────
  const {
    items: cadDrawings, loading: cdLoading, hasNextPage: cdHasNext, loadNext: cdLoadNext,
  } = useCursorPagination<CadDrawing>({
    fetchFn: (input) => cadDrawingsApi.list({ ...input, projectId }),
    limit: 5,
  });

  // ── 시장조사 ──────────────────────────────────────────────
  const {
    items: marketResearches, loading: mrLoading, hasNextPage: mrHasNext, loadNext: mrLoadNext,
  } = useCursorPagination<MarketResearch>({
    fetchFn: (input) => marketResearchesApi.list({ ...input, projectId }),
    limit: 5,
  });

  // ── 설계 검토서 ───────────────────────────────────────────
  const {
    items: designReviews, loading: drLoading,
  } = useCursorPagination<DesignReview>({
    fetchFn: (input) => designReviewsApi.list({ ...input, projectId }),
    limit: 3,
  });

  // ── 워크플로우 단계 계산 ──────────────────────────────────
  const latestBd = basicDesigns[0];
  const latestDr = designReviews[0];

  const workflowSteps = [
    {
      label: '기본설계서',
      icon: '📋',
      status: (
        latestBd?.status === 'distributed' ? 'done' :
        latestBd ? 'active' :
        'pending'
      ) as 'done' | 'active' | 'pending',
    },
    {
      label: '상세설계서',
      icon: '📄',
      status: (
        latestBd?.status === 'distributed' ? 'active' :
        'pending'
      ) as 'done' | 'active' | 'pending',
    },
    {
      label: '3D/2D/조달\n(병렬)',
      icon: '⚡',
      status: (
        renderAssets.some(r => r.status === 'final') &&
        cadDrawings.some(c => c.status === 'issued') &&
        marketResearches.some(m => m.status === 'approved') ? 'done' :
        latestBd?.status === 'distributed' ? 'active' :
        'pending'
      ) as 'done' | 'active' | 'pending',
    },
    {
      label: '통합 검토\n(합류)',
      icon: '🔗',
      status: (
        latestDr?.status === 'approved' ? 'done' :
        latestDr ? 'active' :
        'pending'
      ) as 'done' | 'active' | 'pending',
    },
    {
      label: '컨펌 게이트\n#2',
      icon: '🎯',
      status: (
        latestDr?.status === 'approved' ? 'done' : 'pending'
      ) as 'done' | 'active' | 'pending',
    },
  ];

  // ── 통계 계산 ─────────────────────────────────────────────
  const stats = {
    renders: {
      final: renderAssets.filter(r => r.status === 'final').length,
      total: renderAssets.length,
    },
    drawings: {
      issued: cadDrawings.filter(c => c.status === 'issued').length,
      total: cadDrawings.length,
    },
    researches: {
      approved: marketResearches.filter(m => m.status === 'approved').length,
      total: marketResearches.length,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Phase 2
          </span>
          <h1 className="text-2xl font-bold text-gray-900">설계 단계 대시보드</h1>
        </div>
        <p className="text-sm text-gray-500">
          기획팀(직렬) → 3D·2D·조달팀(병렬) → 통합 검토(합류) · 컨펌 게이트 #2
        </p>
      </div>

      {/* 워크플로우 진행 표시기 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Phase 2 진행 흐름</h2>
        <WorkflowProgress steps={workflowSteps} />
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">3D 렌더링 완료</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.renders.final}<span className="text-base text-gray-400 font-normal">/{stats.renders.total}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">CAD 도면 발행</p>
          <p className="text-2xl font-bold text-teal-600">
            {stats.drawings.issued}<span className="text-base text-gray-400 font-normal">/{stats.drawings.total}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">시장조사 승인</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.researches.approved}<span className="text-base text-gray-400 font-normal">/{stats.researches.total}</span>
          </p>
        </div>
      </div>

      {/* 팀별 작업 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 기획팀 — 기본설계서 */}
        <TeamCard title="기본설계서" team="planning" count={basicDesigns.length}>
          {bdLoading ? <Skeleton /> : (
            <>
              {basicDesigns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">기본설계서가 없습니다.</p>
              ) : (
                basicDesigns.map(bd => (
                  <ItemRow
                    key={bd.id}
                    title={bd.title}
                    subtitle={`v${bd.version} · 층수 ${bd.totalFloors}F`}
                    status={bd.status}
                    meta={bd.distributedAt ? `배포: ${new Date(bd.distributedAt).toLocaleDateString('ko-KR')}` : undefined}
                  />
                ))
              )}
              {bdHasNext && (
                <button
                  onClick={bdLoadNext}
                  className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 text-center py-1"
                >
                  더 보기 →
                </button>
              )}
            </>
          )}
        </TeamCard>

        {/* 3D 디자인팀 — 렌더 에셋 */}
        <TeamCard title="3D 렌더링 에셋" team="design3d" count={renderAssets.length}>
          {raLoading ? <Skeleton /> : (
            <>
              {renderAssets.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">렌더 에셋이 없습니다.</p>
              ) : (
                renderAssets.map(ra => (
                  <ItemRow
                    key={ra.id}
                    title={ra.title}
                    subtitle={`${ra.assetType} · v${ra.version}${ra.createdBy ? ` · ${ra.createdBy}` : ''}`}
                    status={ra.status}
                  />
                ))
              )}
              {raHasNext && (
                <button
                  onClick={raLoadNext}
                  className="mt-3 w-full text-xs text-purple-600 hover:text-purple-800 text-center py-1"
                >
                  더 보기 →
                </button>
              )}
            </>
          )}
        </TeamCard>

        {/* 2D 디자인팀 — CAD 도면 */}
        <TeamCard title="CAD 도면" team="design2d" count={cadDrawings.length}>
          {cdLoading ? <Skeleton /> : (
            <>
              {cadDrawings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">CAD 도면이 없습니다.</p>
              ) : (
                cadDrawings.map(cd => (
                  <ItemRow
                    key={cd.id}
                    title={`[${cd.drawingNo}] ${cd.title}`}
                    subtitle={`${cd.discipline} · Rev.${cd.currentRevision} · ${cd.floorNumber}F`}
                    status={cd.status}
                    meta={cd.drawnBy}
                  />
                ))
              )}
              {cdHasNext && (
                <button
                  onClick={cdLoadNext}
                  className="mt-3 w-full text-xs text-green-600 hover:text-green-800 text-center py-1"
                >
                  더 보기 →
                </button>
              )}
            </>
          )}
        </TeamCard>

        {/* 조달팀 — 시장조사 */}
        <TeamCard title="시장조사" team="procurement" count={marketResearches.length}>
          {mrLoading ? <Skeleton /> : (
            <>
              {marketResearches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">시장조사 항목이 없습니다.</p>
              ) : (
                marketResearches.map(mr => (
                  <ItemRow
                    key={mr.id}
                    title={mr.itemName}
                    subtitle={`${mr.category} · 수량 ${mr.quantity}${mr.unit ? mr.unit : ''}`}
                    status={mr.status}
                    meta={mr.estimatedMinPrice
                      ? `₩${(mr.estimatedMinPrice / 10000).toFixed(0)}만~₩${((mr.estimatedMaxPrice ?? 0) / 10000).toFixed(0)}만`
                      : undefined}
                  />
                ))
              )}
              {mrHasNext && (
                <button
                  onClick={mrLoadNext}
                  className="mt-3 w-full text-xs text-orange-600 hover:text-orange-800 text-center py-1"
                >
                  더 보기 →
                </button>
              )}
            </>
          )}
        </TeamCard>

        {/* 통합 검토 — 컨펌 게이트 #2 (전체 가로폭) */}
        <div className="lg:col-span-2">
          <TeamCard title="설계 통합 검토서 — 컨펌 게이트 #2" team="review" count={designReviews.length}>
            {drLoading ? <Skeleton /> : (
              <>
                {designReviews.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">아직 설계 통합 검토서가 없습니다.</p>
                    <p className="text-xs text-gray-300 mt-1">
                      기본설계서·상세설계서·3D렌더·CAD도면·시장조사가 모두 완료된 후 생성하세요.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {designReviews.map(dr => (
                      <div key={dr.id} className="py-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{dr.title}</p>
                            {dr.executiveSummary && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dr.executiveSummary}</p>
                            )}
                          </div>
                          <StatusBadge status={dr.status} />
                        </div>
                        {/* 산출물 체크리스트 */}
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {dr.deliverables.map((d, i) => (
                            <div
                              key={i}
                              className={`text-center px-2 py-1.5 rounded-lg text-xs ${
                                d.isCompleted ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
                              }`}
                            >
                              <div className="text-base mb-0.5">{d.isCompleted ? '✅' : '⬜'}</div>
                              <div className="leading-tight">{d.deliverableTitle}</div>
                              <div className="text-gray-400 mt-0.5">{d.teamName}</div>
                            </div>
                          ))}
                        </div>
                        {/* 이슈 수 */}
                        {dr.designIssues.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {['critical', 'major', 'minor'].map(severity => {
                              const count = dr.designIssues.filter(i => i.severity === severity && i.status === 'open').length;
                              if (count === 0) return null;
                              return (
                                <span
                                  key={severity}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    severity === 'critical' ? 'bg-red-100 text-red-700' :
                                    severity === 'major' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {severity} {count}건
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TeamCard>
        </div>
      </div>
    </div>
  );
};

export default Phase2Dashboard;
