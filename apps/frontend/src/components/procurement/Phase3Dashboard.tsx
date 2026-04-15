/**
 * GWONS_CREATIVE — Phase 3 Procurement Dashboard
 * 조달 단계 진행 현황 및 팀별 작업 관리
 *
 * 협업 흐름 시각화:
 *   기획팀+조달팀 (직렬): 최종 조달 목록 확정
 *   → 조달팀 H/W 트랙 (병렬): H/W 발주서 관리
 *   → 조달팀 S/W 트랙 (병렬): S/W·콘텐츠 발주서 관리
 *   → 합류: 통합 납품 일정표
 *   → 기획팀 (직렬): 조달 통합 검토 + 컨펌 게이트 #3
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import {
  procurementListsApi,
  purchaseOrdersApi,
  softwareOrdersApi,
  deliverySchedulesApi,
  procurementReviewsApi,
  type ProcurementList,
  type PurchaseOrder,
  type SoftwareOrder,
  type DeliverySchedule,
  type ProcurementReview,
} from '../../api/procurement.api';

// ─────────────────────────────────────────────────────────
// 상태 뱃지 설정
// ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  // 조달 목록
  drafting: 'bg-gray-100 text-gray-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  locked: 'bg-blue-100 text-blue-800',
  // H/W 발주서
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-sky-100 text-sky-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  inspected: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-red-100 text-red-700',
  // S/W 발주서
  contracted: 'bg-violet-100 text-violet-800',
  in_development: 'bg-amber-100 text-amber-800',
  testing: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-200 text-green-900',
  // 납품 일정
  planning: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delayed: 'bg-red-100 text-red-800',
  // 조달 검토
  collecting: 'bg-slate-100 text-slate-700',
  budget_check: 'bg-amber-100 text-amber-800',
  client_review: 'bg-cyan-100 text-cyan-800',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  // 조달 목록
  drafting: '작성 중', in_review: '검토 중', approved: '승인', locked: '잠금',
  // H/W 발주서
  draft: '초안', submitted: '제출', confirmed: '수주 확인',
  in_transit: '배송 중', delivered: '납품 완료', inspected: '검수 완료', cancelled: '취소',
  // S/W 발주서
  contracted: '계약 완료', in_development: '개발 중', testing: '테스팅', accepted: '인수 완료',
  // 납품 일정
  planning: '계획 중', in_progress: '진행 중', completed: '완료', delayed: '지연',
  // 조달 검토
  collecting: '수집 중', budget_check: '예산 확인', client_review: '클라이언트 검토', rejected: '반려',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
    }`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

// ─────────────────────────────────────────────────────────
// 팀 레이블
// ─────────────────────────────────────────────────────────
const TEAM_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  planning: { label: '기획팀', color: 'border-blue-400', icon: '📋' },
  hw: { label: '조달팀 (H/W)', color: 'border-orange-400', icon: '🔧' },
  sw: { label: '조달팀 (S/W)', color: 'border-purple-400', icon: '💻' },
  delivery: { label: '납품 관리', color: 'border-teal-400', icon: '🚚' },
  review: { label: '조달 검토 (Gate #3)', color: 'border-red-400', icon: '✅' },
};

// ─────────────────────────────────────────────────────────
// 카드 컴포넌트
// ─────────────────────────────────────────────────────────
interface CardProps {
  title: string;
  team: keyof typeof TEAM_LABELS;
  children: React.ReactNode;
  count?: number;
  badge?: React.ReactNode;
}

const TeamCard: React.FC<CardProps> = ({ title, team, children, count, badge }) => {
  const t = TEAM_LABELS[team];
  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${t.color} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{t.icon}</span>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.label}</p>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {count !== undefined && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {count}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 흐름 다이어그램 (Phase 3 워크플로우)
// ─────────────────────────────────────────────────────────
const WorkflowDiagram: React.FC = () => (
  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-6 border border-blue-100">
    <h2 className="text-sm font-semibold text-gray-700 mb-4">📊 Phase 3 조달 워크플로우</h2>
    <div className="flex items-center flex-wrap gap-2">
      {/* 직렬 착수 */}
      <div className="flex items-center bg-blue-100 rounded-lg px-3 py-2 text-xs font-medium text-blue-800">
        <span className="mr-1">📋</span>
        조달 목록 확정
        <span className="ml-2 text-blue-500 text-[10px]">기획+조달팀</span>
      </div>
      <span className="text-gray-400 font-bold">→</span>

      {/* 병렬 분기 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center bg-orange-100 rounded-lg px-3 py-2 text-xs font-medium text-orange-800">
          <span className="mr-1">🔧</span>
          H/W 발주서
          <span className="ml-2 text-orange-500 text-[10px]">조달팀 병렬</span>
        </div>
        <div className="flex items-center bg-purple-100 rounded-lg px-3 py-2 text-xs font-medium text-purple-800">
          <span className="mr-1">💻</span>
          S/W 발주서
          <span className="ml-2 text-purple-500 text-[10px]">조달팀 병렬</span>
        </div>
      </div>
      <span className="text-gray-400 font-bold">→</span>

      {/* 합류 */}
      <div className="flex items-center bg-teal-100 rounded-lg px-3 py-2 text-xs font-medium text-teal-800">
        <span className="mr-1">🚚</span>
        납품 일정표
        <span className="ml-2 text-teal-500 text-[10px]">합류</span>
      </div>
      <span className="text-gray-400 font-bold">→</span>

      {/* Gate #3 */}
      <div className="flex items-center bg-red-100 rounded-lg px-3 py-2 text-xs font-medium text-red-800 border border-red-300">
        <span className="mr-1">✅</span>
        조달 검토
        <span className="ml-1 bg-red-600 text-white text-[10px] px-1 rounded">Gate #3</span>
      </div>
      <span className="text-gray-400 font-bold">→</span>

      <div className="flex items-center bg-green-200 rounded-lg px-3 py-2 text-xs font-bold text-green-900">
        🎉 Phase 4 착수
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// 납품 진행률 바
// ─────────────────────────────────────────────────────────
const DeliveryProgressBar: React.FC<{
  total: number;
  completed: number;
  delayed: number;
}> = ({ total, completed, delayed }) => {
  if (total === 0) return <p className="text-xs text-gray-400">납품 이벤트 없음</p>;
  const completedPct = Math.round((completed / total) * 100);
  const delayedPct = Math.round((delayed / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>납품 진행률</span>
        <span>
          {completed}/{total} 완료 {delayed > 0 && `(${delayed}건 지연)`}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 flex overflow-hidden">
        <div
          className="bg-emerald-500 h-2 transition-all"
          style={{ width: `${completedPct}%` }}
        />
        <div
          className="bg-red-400 h-2 transition-all"
          style={{ width: `${delayedPct}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 메인 대시보드
// ─────────────────────────────────────────────────────────
interface Phase3DashboardProps {
  projectId: string;
}

const Phase3Dashboard: React.FC<Phase3DashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hw' | 'sw' | 'delivery' | 'review'
  >('overview');

  // ── 데이터 로드 ────────────────────────────────────────
  const {
    items: procurementLists,
    loading: plLoading,
    loadNext: plNext,
    hasNextPage: plHasNext,
  } = useCursorPagination<ProcurementList>({
    fetchFn: (input) => procurementListsApi.list({ ...input, projectId }),
    limit: 5,
  });

  const {
    items: purchaseOrders,
    loading: poLoading,
    loadNext: poNext,
    hasNextPage: poHasNext,
  } = useCursorPagination<PurchaseOrder>({
    fetchFn: (input) => purchaseOrdersApi.list({ ...input, projectId }),
    limit: 5,
  });

  const {
    items: softwareOrders,
    loading: soLoading,
    loadNext: soNext,
    hasNextPage: soHasNext,
  } = useCursorPagination<SoftwareOrder>({
    fetchFn: (input) => softwareOrdersApi.list({ ...input, projectId }),
    limit: 5,
  });

  const {
    items: deliverySchedules,
    loading: dsLoading,
    loadNext: dsNext,
    hasNextPage: dsHasNext,
  } = useCursorPagination<DeliverySchedule>({
    fetchFn: (input) => deliverySchedulesApi.list({ ...input, projectId }),
    limit: 5,
  });

  const {
    items: procurementReviews,
    loading: prLoading,
    loadNext: prNext,
    hasNextPage: prHasNext,
  } = useCursorPagination<ProcurementReview>({
    fetchFn: (input) => procurementReviewsApi.list({ ...input, projectId }),
    limit: 5,
  });

  // ── 탭 ────────────────────────────────────────────────
  const TABS = [
    { key: 'overview', label: '전체 현황', icon: '📊' },
    { key: 'hw', label: 'H/W 발주', icon: '🔧' },
    { key: 'sw', label: 'S/W 발주', icon: '💻' },
    { key: 'delivery', label: '납품 일정', icon: '🚚' },
    { key: 'review', label: 'Gate #3', icon: '✅' },
  ] as const;

  // ─────────────────────────────────────────────────────
  // Overview 탭: 모든 모듈 요약
  // ─────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 조달 목록 */}
      <TeamCard title="최종 조달 목록" team="planning" count={procurementLists.length}>
        {plLoading ? (
          <p className="text-sm text-gray-400 py-2">로딩 중...</p>
        ) : procurementLists.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">조달 목록 없음</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {procurementLists.slice(0, 3).map((pl) => (
              <li key={pl.id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{pl.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pl.lineItems?.length ?? 0}개 항목 · v{pl.version}
                      {pl.budgetSummary && (
                        <span className="ml-2">
                          예산 {(pl.budgetSummary.totalEstimated / 1_000_000).toFixed(1)}백만 원
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={pl.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {plHasNext && (
          <button
            onClick={plNext}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            더 보기
          </button>
        )}
      </TeamCard>

      {/* H/W 발주서 */}
      <TeamCard title="H/W 발주서" team="hw" count={purchaseOrders.length}>
        {poLoading ? (
          <p className="text-sm text-gray-400 py-2">로딩 중...</p>
        ) : purchaseOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">발주서 없음</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {purchaseOrders.slice(0, 3).map((po) => (
              <li key={po.id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{po.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {po.orderNo} · {po.vendorName}
                      {po.totalAmount && (
                        <span className="ml-2">
                          {(po.totalAmount / 1_000_000).toFixed(1)}백만 원
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {poHasNext && (
          <button onClick={poNext} className="mt-2 text-xs text-orange-600 hover:underline">
            더 보기
          </button>
        )}
      </TeamCard>

      {/* S/W 발주서 */}
      <TeamCard title="S/W·콘텐츠 발주서" team="sw" count={softwareOrders.length}>
        {soLoading ? (
          <p className="text-sm text-gray-400 py-2">로딩 중...</p>
        ) : softwareOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">발주서 없음</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {softwareOrders.slice(0, 3).map((so) => (
              <li key={so.id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{so.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {so.orderNo} · {so.vendorName}
                      {so.isCustomDevelopment && (
                        <span className="ml-2 text-purple-600">맞춤 개발</span>
                      )}
                      {so.milestones?.length > 0 && (
                        <span className="ml-2">{so.milestones.length}개 마일스톤</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={so.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {soHasNext && (
          <button onClick={soNext} className="mt-2 text-xs text-purple-600 hover:underline">
            더 보기
          </button>
        )}
      </TeamCard>

      {/* 납품 일정표 */}
      <TeamCard title="통합 납품 일정표" team="delivery" count={deliverySchedules.length}>
        {dsLoading ? (
          <p className="text-sm text-gray-400 py-2">로딩 중...</p>
        ) : deliverySchedules.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">납품 일정표 없음</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {deliverySchedules.slice(0, 3).map((ds) => (
              <li key={ds.id} className="py-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{ds.title}</p>
                  <StatusBadge status={ds.status} />
                </div>
                <DeliveryProgressBar
                  total={ds.totalEvents}
                  completed={ds.completedEvents}
                  delayed={ds.delayedEvents}
                />
                {ds.targetCompletionDate && (
                  <p className="text-xs text-gray-400">
                    목표 완료일: {new Date(ds.targetCompletionDate).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {dsHasNext && (
          <button onClick={dsNext} className="mt-2 text-xs text-teal-600 hover:underline">
            더 보기
          </button>
        )}
      </TeamCard>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // Gate #3 탭: 조달 통합 검토
  // ─────────────────────────────────────────────────────
  const ReviewTab = () => (
    <TeamCard
      title="조달 통합 검토서 — 컨펌 게이트 #3"
      team="review"
      count={procurementReviews.length}
      badge={
        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded font-bold">
          Gate #3
        </span>
      }
    >
      {prLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">로딩 중...</p>
      ) : procurementReviews.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-400 text-sm">조달 검토서 없음</p>
          <p className="text-gray-300 text-xs mt-1">모든 조달 산출물 완료 후 검토서를 생성하세요</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {procurementReviews.map((pr) => (
            <li key={pr.id} className="py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{pr.title}</p>
                  {pr.executiveSummary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {pr.executiveSummary}
                    </p>
                  )}
                </div>
                <StatusBadge status={pr.status} />
              </div>

              {/* 예산 정보 */}
              {pr.totalProcurementAmount !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">예산 현황</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>
                      총 조달액:{' '}
                      <span className="font-semibold text-gray-900">
                        {(pr.totalProcurementAmount / 1_000_000).toFixed(1)}백만 원
                      </span>
                    </span>
                    {pr.budgetVariance !== undefined && (
                      <span>
                        예산 차이:{' '}
                        <span
                          className={`font-semibold ${
                            pr.budgetVariance <= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {pr.budgetVariance >= 0 ? '+' : ''}
                          {(pr.budgetVariance / 1_000_000).toFixed(1)}백만 원
                        </span>
                      </span>
                    )}
                    {pr.isWithinBudget !== undefined && (
                      <span
                        className={`font-bold ${
                          pr.isWithinBudget ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pr.isWithinBudget ? '✓ 예산 내' : '✗ 예산 초과'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 산출물 현황 */}
              {pr.deliverables?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">
                    산출물 ({pr.deliverables.filter((d) => d.isCompleted).length}/{pr.deliverables.length} 완료)
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {pr.deliverables.map((d, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
                          d.isCompleted
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        <span>{d.isCompleted ? '✓' : '○'}</span>
                        <span className="truncate">{d.deliverableTitle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이슈 현황 */}
              {pr.procurementIssues?.length > 0 && (
                <div className="flex gap-2">
                  {['critical', 'major', 'minor'].map((sev) => {
                    const openCount = pr.procurementIssues.filter(
                      (i) => i.severity === sev && i.status === 'open',
                    ).length;
                    if (openCount === 0) return null;
                    return (
                      <span
                        key={sev}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          sev === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : sev === 'major'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {sev.toUpperCase()} {openCount}건
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 승인 정보 */}
              {pr.status === 'approved' && pr.approvedBy && (
                <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-800">
                  ✅ 승인:{' '}
                  <span className="font-semibold">{pr.approvedBy}</span>
                  {pr.approvedAt && (
                    <span className="ml-2 text-green-600">
                      {new Date(pr.approvedAt).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                  <br />
                  🎉 <span className="font-bold">Phase 4 (구현 단계) 착수 승인</span>
                </div>
              )}

              {pr.status === 'rejected' && pr.clientFeedback && (
                <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-800">
                  ❌ 반려: {pr.clientFeedback}
                </div>
              )}

              {/* 버전 / 날짜 */}
              <p className="text-xs text-gray-400">
                v{pr.version} · {new Date(pr.updatedAt).toLocaleString('ko-KR')}
              </p>
            </li>
          ))}
        </ul>
      )}
      {prHasNext && (
        <button onClick={prNext} className="mt-2 text-xs text-red-600 hover:underline">
          더 보기
        </button>
      )}
    </TeamCard>
  );

  // ─────────────────────────────────────────────────────
  // H/W 발주 탭
  // ─────────────────────────────────────────────────────
  const HWTab = () => (
    <TeamCard title="H/W 구매 발주서 관리" team="hw" count={purchaseOrders.length}>
      {poLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">로딩 중...</p>
      ) : purchaseOrders.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">H/W 발주서 없음</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {purchaseOrders.map((po) => (
            <li key={po.id} className="py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{po.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {po.orderNo} · {po.vendorName}
                  </p>
                </div>
                <StatusBadge status={po.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-600">
                {po.totalAmount && (
                  <span>금액: {(po.totalAmount / 1_000_000).toFixed(1)}백만 원</span>
                )}
                {po.requiredDeliveryDate && (
                  <span>
                    납품 요청: {new Date(po.requiredDeliveryDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {po.expectedDeliveryDate && (
                  <span>
                    예정: {new Date(po.expectedDeliveryDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {po.lineItems?.length > 0 && (
                  <span>{po.lineItems.length}개 발주 항목</span>
                )}
              </div>
              {po.inspectionResult && (
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    po.inspectionResult.overallResult === 'pass'
                      ? 'bg-green-50 text-green-700'
                      : po.inspectionResult.overallResult === 'conditional_pass'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  검수: {po.inspectionResult.overallResult === 'pass' ? '합격' : po.inspectionResult.overallResult === 'conditional_pass' ? '조건부 합격' : '불합격'}{' '}
                  ({po.inspectionResult.passedItems}/{po.inspectionResult.passedItems + po.inspectionResult.failedItems} 통과)
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {poHasNext && (
        <button onClick={poNext} className="mt-2 text-xs text-orange-600 hover:underline">
          더 보기
        </button>
      )}
    </TeamCard>
  );

  // ─────────────────────────────────────────────────────
  // S/W 발주 탭
  // ─────────────────────────────────────────────────────
  const SWTab = () => (
    <TeamCard title="S/W·콘텐츠 발주서 관리" team="sw" count={softwareOrders.length}>
      {soLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">로딩 중...</p>
      ) : softwareOrders.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">S/W 발주서 없음</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {softwareOrders.map((so) => (
            <li key={so.id} className="py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{so.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {so.orderNo} · {so.vendorName}
                    {so.isCustomDevelopment && (
                      <span className="ml-2 text-purple-600 font-medium">맞춤 개발</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={so.status} />
              </div>
              {/* 마일스톤 */}
              {so.milestones?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    마일스톤 ({so.milestones.filter((m) => m.status === 'completed').length}/{so.milestones.length} 완료)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {so.milestones.map((m) => (
                      <span
                        key={m.milestoneNo}
                        className={`px-2 py-0.5 rounded text-xs ${
                          m.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : m.status === 'delayed'
                            ? 'bg-red-100 text-red-700'
                            : m.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        M{m.milestoneNo}. {m.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {so.contractAmount && (
                <p className="text-xs text-gray-500">
                  계약 금액: {(so.contractAmount / 1_000_000).toFixed(1)}백만 원
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {soHasNext && (
        <button onClick={soNext} className="mt-2 text-xs text-purple-600 hover:underline">
          더 보기
        </button>
      )}
    </TeamCard>
  );

  // ─────────────────────────────────────────────────────
  // 납품 일정 탭
  // ─────────────────────────────────────────────────────
  const DeliveryTab = () => (
    <TeamCard title="통합 납품 일정표" team="delivery" count={deliverySchedules.length}>
      {dsLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">로딩 중...</p>
      ) : deliverySchedules.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">납품 일정표 없음</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {deliverySchedules.map((ds) => (
            <li key={ds.id} className="py-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{ds.title}</p>
                  {ds.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ds.description}</p>
                  )}
                </div>
                <StatusBadge status={ds.status} />
              </div>
              <DeliveryProgressBar
                total={ds.totalEvents}
                completed={ds.completedEvents}
                delayed={ds.delayedEvents}
              />
              <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
                {ds.targetCompletionDate && (
                  <span>
                    목표 완료일: {new Date(ds.targetCompletionDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {ds.actualCompletionDate && (
                  <span className="text-green-600">
                    실제 완료: {new Date(ds.actualCompletionDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
              {/* 납품 이벤트 목록 */}
              {ds.deliveryEvents?.length > 0 && (
                <div className="space-y-1">
                  {ds.deliveryEvents.slice(0, 4).map((ev) => (
                    <div
                      key={ev.eventId}
                      className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                        ev.status === 'delivered'
                          ? 'bg-green-50'
                          : ev.status === 'delayed'
                          ? 'bg-red-50'
                          : ev.status === 'cancelled'
                          ? 'bg-gray-50'
                          : 'bg-blue-50'
                      }`}
                    >
                      <span className="truncate text-gray-700">
                        {ev.orderType === 'purchase' ? '🔧' : '💻'} {ev.itemSummary}
                      </span>
                      <span
                        className={`ml-2 font-medium flex-shrink-0 ${
                          ev.status === 'delivered'
                            ? 'text-green-700'
                            : ev.status === 'delayed'
                            ? 'text-red-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {ev.status === 'delivered'
                          ? '✓ 완료'
                          : ev.status === 'delayed'
                          ? `⚠ ${ev.delayDays ?? 0}일 지연`
                          : ev.status === 'cancelled'
                          ? '✗ 취소'
                          : `📅 ${ev.plannedDate}`}
                      </span>
                    </div>
                  ))}
                  {ds.deliveryEvents.length > 4 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{ds.deliveryEvents.length - 4}건 더 보기
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {dsHasNext && (
        <button onClick={dsNext} className="mt-2 text-xs text-teal-600 hover:underline">
          더 보기
        </button>
      )}
    </TeamCard>
  );

  // ─────────────────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
            Phase 3
          </span>
          <h1 className="text-xl font-bold text-gray-900">조달 관리 대시보드</h1>
        </div>
        <p className="text-sm text-gray-500">
          GWONS_CREATIVE — 전시 체험관 H/W·S/W 조달 및 납품 통합 관리
        </p>
      </div>

      {/* 워크플로우 다이어그램 */}
      <WorkflowDiagram />

      {/* 탭 */}
      <div className="flex gap-1 mb-5 bg-white rounded-lg p-1 shadow-sm border border-gray-100 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'hw' && <HWTab />}
        {activeTab === 'sw' && <SWTab />}
        {activeTab === 'delivery' && <DeliveryTab />}
        {activeTab === 'review' && <ReviewTab />}
      </div>
    </div>
  );
};

export default Phase3Dashboard;
