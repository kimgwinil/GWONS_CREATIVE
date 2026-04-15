/**
 * GWONS_CREATIVE — Phase 4 Implementation Dashboard
 * 시공·구현 단계 진행 현황 및 팀별 작업 관리
 *
 * 협업 흐름 시각화:
 *   Gate #3 통과 후 병렬 착수:
 *     시공팀   → 시공 계획 (planning→approved→in_progress→completed→inspected)
 *     3D팀     → 현장 시각화 (draft→in_review→revision→approved→final)
 *     S/W팀    → 콘텐츠 설치 (pending→in_progress→integration→testing→completed)
 *     기획팀   → 품질 점검 (scheduled→in_progress→completed/failed→re_inspected)
 *   합류:
 *     기획팀   → 통합 테스트 → 컨펌 게이트 #4 → Phase 5(운영) 착수
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  constructionPlansApi,
  siteVisualizationsApi,
  contentInstallationsApi,
  qualityInspectionsApi,
  integrationTestsApi,
  type ConstructionPlan,
  type SiteVisualization,
  type ContentInstallation,
  type QualityInspection,
  type IntegrationTest,
} from '../../api/implementation.api';

// ─────────────────────────────────────────────────────────
// 상태 뱃지 설정
// ─────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  // 시공 계획
  planning:      'bg-slate-100 text-slate-700',
  approved:      'bg-green-100 text-green-800',
  in_progress:   'bg-blue-100 text-blue-800',
  suspended:     'bg-red-100 text-red-700',
  completed:     'bg-emerald-100 text-emerald-800',
  inspected:     'bg-teal-100 text-teal-800',
  // 현장 시각화
  draft:         'bg-gray-100 text-gray-700',
  in_review:     'bg-yellow-100 text-yellow-800',
  revision:      'bg-orange-100 text-orange-800',
  final:         'bg-violet-100 text-violet-800',
  // 콘텐츠 설치
  pending:       'bg-slate-100 text-slate-700',
  integration:   'bg-indigo-100 text-indigo-800',
  testing:       'bg-purple-100 text-purple-800',
  // 품질 점검
  scheduled:     'bg-sky-100 text-sky-800',
  failed:        'bg-red-100 text-red-800',
  re_inspected:  'bg-cyan-100 text-cyan-800',
  // 통합 테스트
  preparing:     'bg-slate-100 text-slate-700',
  in_simulation: 'bg-amber-100 text-amber-800',
  client_review: 'bg-cyan-100 text-cyan-800',
  rejected:      'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  // 시공 계획
  planning:      '계획 중',
  approved:      '승인',
  in_progress:   '시공 중',
  suspended:     '중단',
  completed:     '시공 완료',
  inspected:     '준공 검수',
  // 현장 시각화
  draft:         '초안',
  in_review:     '검토 중',
  revision:      '수정 중',
  final:         '최종 확정',
  // 콘텐츠 설치
  pending:       '설치 대기',
  integration:   '시스템 연동',
  testing:       '테스팅',
  // 품질 점검
  scheduled:     '점검 예정',
  failed:        '불합격',
  re_inspected:  '재검수 완료',
  // 통합 테스트
  preparing:     '준비 중',
  in_simulation: '시뮬레이션',
  client_review: '클라이언트 검토',
  rejected:      '반려',
  // 공통
  completed:     '완료',
  approved:      '승인',
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
  construction:  { label: '시공팀', color: 'border-orange-400', icon: '🏗️' },
  visualization: { label: '3D 디자인팀', color: 'border-purple-400', icon: '🖥️' },
  content:       { label: '소프트웨어팀', color: 'border-blue-400', icon: '💻' },
  quality:       { label: '기획팀 (품질)', color: 'border-teal-400', icon: '🔍' },
  integration:   { label: '기획팀 (Gate #4)', color: 'border-red-500', icon: '✅' },
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {count}건
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 항목 행 컴포넌트
// ─────────────────────────────────────────────────────────
const ItemRow: React.FC<{
  title: string;
  status: string;
  sub?: string;
  progress?: number;
  extra?: React.ReactNode;
}> = ({ title, status, sub, progress, extra }) => (
  <div className="py-3 flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{progress}%</span>
          </div>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {extra}
      <StatusBadge status={status} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// 통계 카드
// ─────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; color?: string; icon: string }> = ({
  label, value, color = 'text-gray-900', icon,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
    <div className="flex-shrink-0 text-2xl">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Phase 4 진행 흐름 표시
// ─────────────────────────────────────────────────────────
const Phase4FlowDiagram: React.FC<{
  constructionCount: number;
  visualizationCount: number;
  contentCount: number;
  qualityCount: number;
  integrationCount: number;
}> = ({ constructionCount, visualizationCount, contentCount, qualityCount, integrationCount }) => (
  <div className="bg-white rounded-xl shadow-sm p-5">
    <h3 className="text-sm font-semibold text-gray-700 mb-4">Phase 4 협업 흐름</h3>
    <div className="flex items-start gap-2 overflow-x-auto pb-2">
      {/* Gate #3 */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
          G3
        </div>
        <span className="text-xs text-gray-500 text-center">Gate #3<br/>통과</span>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center mt-4">
        <div className="w-4 h-0.5 bg-gray-300" />
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400" />
      </div>

      {/* Parallel block */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        <div className="text-xs text-gray-400 font-medium text-center mb-1">병렬 착수</div>
        {[
          { icon: '🏗️', label: '시공팀', count: constructionCount, color: 'border-orange-400' },
          { icon: '🖥️', label: '3D팀', count: visualizationCount, color: 'border-purple-400' },
          { icon: '💻', label: 'S/W팀', count: contentCount, color: 'border-blue-400' },
          { icon: '🔍', label: '품질 점검', count: qualityCount, color: 'border-teal-400' },
        ].map((item) => (
          <div key={item.label} className={`border-l-2 ${item.color} pl-2 py-1 bg-gray-50 rounded-r-md`}>
            <div className="flex items-center gap-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
              <span className="text-xs text-gray-400">({item.count})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center mt-4">
        <div className="w-4 h-0.5 bg-gray-300" />
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400" />
      </div>

      {/* Integration Test */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-16 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white text-xs font-bold">
          통합 테스트
        </div>
        <span className="text-xs text-gray-500 text-center">({integrationCount})</span>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center mt-4">
        <div className="w-4 h-0.5 bg-gray-300" />
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400" />
      </div>

      {/* Gate #4 */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
          G4
        </div>
        <span className="text-xs text-gray-500 text-center">컨펌<br/>Gate #4</span>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 flex items-center mt-4">
        <div className="w-4 h-0.5 bg-gray-300" />
        <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-400" />
      </div>

      {/* Phase 5 */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-12 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
          P5
        </div>
        <span className="text-xs text-gray-500 text-center">Phase 5<br/>운영 착수</span>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// 메인 대시보드
// ─────────────────────────────────────────────────────────
interface Phase4DashboardProps {
  projectId: string;
}

export const Phase4Dashboard: React.FC<Phase4DashboardProps> = ({ projectId }) => {
  const [constructions, setConstructions] = useState<ConstructionPlan[]>([]);
  const [visualizations, setVisualizations] = useState<SiteVisualization[]>([]);
  const [installations, setInstallations] = useState<ContentInstallation[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, v, i, q, t] = await Promise.all([
        constructionPlansApi.list({ projectId, limit: 20 }),
        siteVisualizationsApi.list({ projectId, limit: 20 }),
        contentInstallationsApi.list({ projectId, limit: 20 }),
        qualityInspectionsApi.list({ projectId, limit: 20 }),
        integrationTestsApi.list({ projectId, limit: 20 }),
      ]);
      setConstructions(c.data ?? []);
      setVisualizations(v.data ?? []);
      setInstallations(i.data ?? []);
      setInspections(q.data ?? []);
      setIntegrations(t.data ?? []);
    } catch (e) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchAll} className="mt-3 text-sm text-red-500 hover:underline">재시도</button>
      </div>
    );
  }

  // 통계 계산
  const completedConstructions = constructions.filter(c => ['completed', 'inspected'].includes(c.status)).length;
  const finalVisualizations    = visualizations.filter(v => v.status === 'final').length;
  const completedInstallations = installations.filter(i => i.status === 'completed').length;
  const passedInspections      = inspections.filter(i => ['completed', 're_inspected'].includes(i.status)).length;
  const approvedIntegrations   = integrations.filter(t => t.status === 'approved').length;

  const avgProgress = constructions.length > 0
    ? Math.round(constructions.reduce((sum, c) => sum + (c.overallProgressRate ?? 0), 0) / constructions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Phase 4 — 시공·구현 단계</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gate #3 통과 후 병렬 착수 → 통합 테스트 → Gate #4 → Phase 5
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="시공 완료" value={`${completedConstructions}/${constructions.length}`} color="text-orange-600" icon="🏗️" />
        <StatCard label="시각화 확정" value={`${finalVisualizations}/${visualizations.length}`} color="text-purple-600" icon="🖥️" />
        <StatCard label="설치 완료" value={`${completedInstallations}/${installations.length}`} color="text-blue-600" icon="💻" />
        <StatCard label="품질 합격" value={`${passedInspections}/${inspections.length}`} color="text-teal-600" icon="🔍" />
        <StatCard label="Gate #4" value={approvedIntegrations > 0 ? '통과 ✓' : `${integrations.length}건`} color={approvedIntegrations > 0 ? 'text-green-600' : 'text-gray-600'} icon="✅" />
      </div>

      {/* 흐름 다이어그램 */}
      <Phase4FlowDiagram
        constructionCount={constructions.length}
        visualizationCount={visualizations.length}
        contentCount={installations.length}
        qualityCount={inspections.length}
        integrationCount={integrations.length}
      />

      {/* 팀별 현황 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 시공팀 */}
        <TeamCard title="시공 계획" team="construction" count={constructions.length}>
          {constructions.length === 0 ? (
            <p className="py-4 text-sm text-gray-400 text-center">등록된 시공 계획이 없습니다.</p>
          ) : (
            constructions.map(c => (
              <ItemRow
                key={c.id}
                title={c.title}
                status={c.status}
                sub={c.siteManager ? `책임자: ${c.siteManager}` : undefined}
                progress={c.overallProgressRate}
                extra={
                  c.delayedTasks > 0 ? (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      지연 {c.delayedTasks}건
                    </span>
                  ) : undefined
                }
              />
            ))
          )}
        </TeamCard>

        {/* 3D 디자인팀 */}
        <TeamCard title="현장 시각화" team="visualization" count={visualizations.length}>
          {visualizations.length === 0 ? (
            <p className="py-4 text-sm text-gray-400 text-center">등록된 시각화가 없습니다.</p>
          ) : (
            visualizations.map(v => (
              <ItemRow
                key={v.id}
                title={v.title}
                status={v.status}
                sub={`${v.vizType} | Rev.${v.currentRevision}${v.targetZone ? ` | ${v.targetZone}` : ''}`}
              />
            ))
          )}
        </TeamCard>

        {/* 소프트웨어팀 */}
        <TeamCard title="콘텐츠 설치" team="content" count={installations.length}>
          {installations.length === 0 ? (
            <p className="py-4 text-sm text-gray-400 text-center">등록된 콘텐츠 설치가 없습니다.</p>
          ) : (
            installations.map(ci => {
              const installProgress = ci.totalItems > 0
                ? Math.round((ci.installedItems / ci.totalItems) * 100)
                : 0;
              return (
                <ItemRow
                  key={ci.id}
                  title={ci.title}
                  status={ci.status}
                  sub={`설치: ${ci.installedItems}/${ci.totalItems}${ci.installationLead ? ` | ${ci.installationLead}` : ''}`}
                  progress={installProgress}
                  extra={
                    ci.failedItems > 0 ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        실패 {ci.failedItems}건
                      </span>
                    ) : undefined
                  }
                />
              );
            })
          )}
        </TeamCard>

        {/* 기획팀 — 품질 점검 */}
        <TeamCard title="품질 점검" team="quality" count={inspections.length}>
          {inspections.length === 0 ? (
            <p className="py-4 text-sm text-gray-400 text-center">등록된 품질 점검이 없습니다.</p>
          ) : (
            inspections.map(qi => {
              const passRate = qi.totalItems > 0
                ? Math.round((qi.passedItems / qi.totalItems) * 100)
                : 0;
              return (
                <ItemRow
                  key={qi.id}
                  title={qi.title}
                  status={qi.status}
                  sub={`${qi.category} | ${qi.inspector ?? '미배정'}${qi.targetZone ? ` | ${qi.targetZone}` : ''}`}
                  progress={qi.status !== 'scheduled' ? passRate : undefined}
                  extra={
                    qi.defects.length > 0 ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        qi.defects.some(d => d.severity === 'critical' && d.status === 'open')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        결함 {qi.defects.length}건
                      </span>
                    ) : undefined
                  }
                />
              );
            })
          )}
        </TeamCard>
      </div>

      {/* 통합 테스트 — Gate #4 (전폭) */}
      <TeamCard title="통합 테스트 — 컨펌 게이트 #4" team="integration" count={integrations.length}>
        {integrations.length === 0 ? (
          <p className="py-6 text-sm text-gray-400 text-center">등록된 통합 테스트가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            {integrations.map(it => (
              <div key={it.id} className="border border-gray-100 rounded-lg p-4 hover:border-red-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-800 flex-1">{it.title}</h4>
                  <StatusBadge status={it.status} />
                </div>
                {it.executiveSummary && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{it.executiveSummary}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">산출물</span>
                    <span className="ml-1 font-medium text-gray-700">
                      {it.deliverables.filter(d => d.isCompleted).length}/{it.deliverables.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">시뮬레이션</span>
                    <span className="ml-1 font-medium text-gray-700">
                      {it.simulations.filter(s => s.overallResult).length}/{it.simulations.length}
                    </span>
                  </div>
                  {it.simulationResult && (
                    <div>
                      <span className="text-gray-400">시뮬 결과</span>
                      <span className={`ml-1 font-medium ${
                        it.simulationResult === 'pass' ? 'text-green-600'
                        : it.simulationResult === 'fail' ? 'text-red-600'
                        : 'text-amber-600'
                      }`}>
                        {it.simulationResult === 'pass' ? '합격' : it.simulationResult === 'fail' ? '불합격' : '부분 합격'}
                      </span>
                    </div>
                  )}
                  {it.approvedBy && (
                    <div>
                      <span className="text-gray-400">승인자</span>
                      <span className="ml-1 font-medium text-green-600">{it.approvedBy} ✓</span>
                    </div>
                  )}
                </div>
                {it.status === 'approved' && (
                  <div className="mt-3 pt-2 border-t border-green-100">
                    <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <span>🎉</span>
                      Gate #4 통과 — Phase 5 운영 착수 가능!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TeamCard>

      {/* Phase 5 전환 상태 */}
      {approvedIntegrations > 0 && (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎊</span>
            <div>
              <h3 className="text-lg font-bold">컨펌 게이트 #4 통과!</h3>
              <p className="text-sm text-violet-100 mt-0.5">
                Phase 4 구현 단계 완료. Phase 5 운영 단계를 착수하세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase4Dashboard;
