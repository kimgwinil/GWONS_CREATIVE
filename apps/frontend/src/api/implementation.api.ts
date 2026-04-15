/**
 * GWONS_CREATIVE — Implementation API (Phase 4)
 * 시공·구현 단계 API: 시공 계획, 현장 시각화, 콘텐츠 설치, 품질 점검, 통합 테스트
 *
 * 협업 흐름 (Gate #3 이후):
 *   병렬 착수:
 *     시공팀   → ConstructionPlan  (planning→approved→in_progress→completed→inspected)
 *     3D팀     → SiteVisualization (draft→in_review→revision→approved→final)
 *     S/W팀    → ContentInstallation (pending→in_progress→integration→testing→completed)
 *     기획팀   → QualityInspection (scheduled→in_progress→completed/failed→re_inspected)
 *   합류:
 *     기획팀   → IntegrationTest (preparing→in_simulation→in_review→client_review→approved)
 *     APPROVED → 컨펌 게이트 #4 → Phase 5(운영) 착수
 */
import { fetchPaginated, apiClient } from './client';
import { PaginationInput, PaginatedResponse } from '../types/pagination';

// ─────────────────────────────────────────────────────────
// 1. 시공 계획서 (ConstructionPlan)
// ─────────────────────────────────────────────────────────
export type ConstructionStatus =
  | 'planning' | 'approved' | 'in_progress' | 'suspended' | 'completed' | 'inspected';

export type ConstructionZoneType =
  | 'main_hall' | 'entrance' | 'experience' | 'utility' | 'outdoor';

export interface ConstructionTask {
  taskId: string;
  taskName: string;
  zone: string;
  zoneType: ConstructionZoneType;
  contractor: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  progressRate: number;
  delayDays?: number;
  delayReason?: string;
  notes?: string;
}

export interface StructureItem {
  itemId: string;
  itemName: string;
  zone: string;
  quantity: number;
  unit: string;
  material?: string;
  installedBy: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'installed' | 'failed';
  defectNote?: string;
  purchaseOrderRef?: string;
}

export interface SafetyCheckRecord {
  checkId: string;
  checkDate: string;
  checkedBy: string;
  zone: string;
  result: 'pass' | 'fail' | 'warning';
  findings?: string;
  correctionRequired?: string;
  correctedAt?: string;
}

export interface ConstructionPlan {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ConstructionStatus;
  tasks: ConstructionTask[];
  structureItems: StructureItem[];
  safetyChecks: SafetyCheckRecord[];
  overallProgressRate: number;
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  siteManager?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  procurementListId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const constructionPlansApi = {
  list: (params: PaginationInput & { projectId?: string; status?: ConstructionStatus }) =>
    fetchPaginated<ConstructionPlan>('/construction-plans', params),

  get: (id: string) =>
    apiClient.get<ConstructionPlan>(`/construction-plans/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    tasks?: ConstructionTask[];
    structureItems?: StructureItem[];
    plannedStartDate?: string;
    plannedEndDate?: string;
    siteManager?: string;
    procurementListId?: string;
  }) => apiClient.post<ConstructionPlan>('/construction-plans', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    tasks: ConstructionTask[];
    structureItems: StructureItem[];
    plannedStartDate: string;
    plannedEndDate: string;
    siteManager: string;
    notes: string;
  }>) => apiClient.patch<ConstructionPlan>(`/construction-plans/${id}`, data),

  approve:    (id: string) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/approve`, {}),
  start:      (id: string) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/start`, {}),
  suspend:    (id: string, reason: string) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/suspend`, { reason }),
  resume:     (id: string) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/resume`, {}),
  complete:   (id: string) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/complete`, {}),
  inspect:    (id: string, data: { inspectedBy: string; result: 'pass' | 'conditional_pass'; findings?: string }) =>
    apiClient.post<ConstructionPlan>(`/construction-plans/${id}/inspect`, data),
  updateTask: (id: string, taskId: string, data: Partial<ConstructionTask>) =>
    apiClient.patch<ConstructionPlan>(`/construction-plans/${id}/tasks/${taskId}`, data),

  remove: (id: string) =>
    apiClient.delete<void>(`/construction-plans/${id}`),
};

// ─────────────────────────────────────────────────────────
// 2. 현장 시각화 (SiteVisualization)
// ─────────────────────────────────────────────────────────
export type SiteVisualizationStatus =
  | 'draft' | 'in_review' | 'revision' | 'approved' | 'final';

export type VisualizationType =
  | 'as_built' | 'progress_viz' | 'comparison' | 'walkthrough' | 'vr_tour';

export interface RevisionRecord {
  revisionNo: number;
  revisedAt: string;
  revisedBy: string;
  changeDescription: string;
  previousFileUrl?: string;
}

export interface SiteVisualization {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  vizType: VisualizationType;
  status: SiteVisualizationStatus;
  sourceFileUrl?: string;
  outputFileUrl?: string;
  thumbnailUrl?: string;
  revisionHistory: RevisionRecord[];
  currentRevision: number;
  targetZone?: string;
  constructionPlanId?: string;
  renderAssetId?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const siteVisualizationsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: SiteVisualizationStatus; vizType?: VisualizationType }) =>
    fetchPaginated<SiteVisualization>('/site-visualizations', params),

  get: (id: string) =>
    apiClient.get<SiteVisualization>(`/site-visualizations/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    vizType: VisualizationType;
    description?: string;
    sourceFileUrl?: string;
    outputFileUrl?: string;
    thumbnailUrl?: string;
    targetZone?: string;
    constructionPlanId?: string;
    renderAssetId?: string;
    createdBy?: string;
  }) => apiClient.post<SiteVisualization>('/site-visualizations', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    sourceFileUrl: string;
    outputFileUrl: string;
    thumbnailUrl: string;
    targetZone: string;
  }>) => apiClient.patch<SiteVisualization>(`/site-visualizations/${id}`, data),

  submitForReview: (id: string) =>
    apiClient.post<SiteVisualization>(`/site-visualizations/${id}/submit`, {}),
  requestRevision: (id: string, reason: string) =>
    apiClient.post<SiteVisualization>(`/site-visualizations/${id}/request-revision`, { reason }),
  approve:         (id: string, approvedBy: string) =>
    apiClient.post<SiteVisualization>(`/site-visualizations/${id}/approve`, { approvedBy }),
  markFinal:       (id: string) =>
    apiClient.post<SiteVisualization>(`/site-visualizations/${id}/final`, {}),

  remove: (id: string) =>
    apiClient.delete<void>(`/site-visualizations/${id}`),
};

// ─────────────────────────────────────────────────────────
// 3. 콘텐츠 설치 (ContentInstallation)
// ─────────────────────────────────────────────────────────
export type InstallationStatus =
  | 'pending' | 'in_progress' | 'integration' | 'testing' | 'completed';

export type ContentType =
  | 'interactive' | 'video' | 'audio' | 'lighting' | 'control_system' | 'kiosk' | 'ar_vr' | 'sensor';

export interface InstallationItem {
  itemId: string;
  contentName: string;
  contentType: ContentType;
  targetDevice: string;
  targetZone: string;
  version: string;
  installedBy: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'in_progress' | 'installed' | 'failed' | 'tested';
  testResult?: 'pass' | 'fail';
  failureNote?: string;
  softwareOrderRef?: string;
}

export interface TechIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  deviceId?: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolution?: string;
  resolvedAt?: string;
}

export interface ContentInstallation {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: InstallationStatus;
  installationItems: InstallationItem[];
  techIssues: TechIssue[];
  totalItems: number;
  installedItems: number;
  failedItems: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  installationLead?: string;
  softwareOrderId?: string;
  constructionPlanId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const contentInstallationsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: InstallationStatus }) =>
    fetchPaginated<ContentInstallation>('/content-installations', params),

  get: (id: string) =>
    apiClient.get<ContentInstallation>(`/content-installations/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    installationItems?: InstallationItem[];
    plannedStartDate?: string;
    plannedEndDate?: string;
    installationLead?: string;
    softwareOrderId?: string;
    constructionPlanId?: string;
  }) => apiClient.post<ContentInstallation>('/content-installations', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    installationItems: InstallationItem[];
    techIssues: TechIssue[];
    plannedStartDate: string;
    plannedEndDate: string;
    installationLead: string;
    notes: string;
  }>) => apiClient.patch<ContentInstallation>(`/content-installations/${id}`, data),

  startInstallation: (id: string) =>
    apiClient.post<ContentInstallation>(`/content-installations/${id}/start`, {}),
  startIntegration:  (id: string) =>
    apiClient.post<ContentInstallation>(`/content-installations/${id}/integrate`, {}),
  startTesting:      (id: string) =>
    apiClient.post<ContentInstallation>(`/content-installations/${id}/test`, {}),
  complete:          (id: string) =>
    apiClient.post<ContentInstallation>(`/content-installations/${id}/complete`, {}),
  updateItem:        (id: string, itemId: string, data: Partial<InstallationItem>) =>
    apiClient.patch<ContentInstallation>(`/content-installations/${id}/items/${itemId}`, data),
  resolveIssue:      (id: string, issueId: string, resolution: string) =>
    apiClient.post<ContentInstallation>(`/content-installations/${id}/issues/${issueId}/resolve`, { resolution }),

  remove: (id: string) =>
    apiClient.delete<void>(`/content-installations/${id}`),
};

// ─────────────────────────────────────────────────────────
// 4. 품질 점검 (QualityInspection)
// ─────────────────────────────────────────────────────────
export type InspectionStatus =
  | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 're_inspected';

export type InspectionCategory =
  | 'construction' | 'content' | 'system' | 'safety' | 'design' | 'experience';

export interface ChecklistItem {
  itemId: string;
  category: InspectionCategory;
  zone: string;
  checkPoint: string;
  standard: string;
  result: 'pass' | 'fail' | 'na' | 'pending';
  actualValue?: string;
  inspectorNote?: string;
  photoUrl?: string;
  isDefect: boolean;
  defectSeverity?: 'critical' | 'major' | 'minor';
}

export interface DefectRecord {
  defectId: string;
  checklistItemId: string;
  severity: 'critical' | 'major' | 'minor';
  category: InspectionCategory;
  zone: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'resolved' | 'waived';
  resolution?: string;
  resolvedAt?: string;
}

export interface QualityInspection {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: InspectionStatus;
  category: InspectionCategory;
  checklistItems: ChecklistItem[];
  defects: DefectRecord[];
  totalItems: number;
  passedItems: number;
  failedItems: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  inspector?: string;
  targetZone?: string;
  finalResult?: string;
  overallComment?: string;
  constructionPlanId?: string;
  contentInstallationId?: string;
  inspectionRound: number;
  createdAt: string;
  updatedAt: string;
}

export const qualityInspectionsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: InspectionStatus; category?: InspectionCategory }) =>
    fetchPaginated<QualityInspection>('/quality-inspections', params),

  get: (id: string) =>
    apiClient.get<QualityInspection>(`/quality-inspections/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    category: InspectionCategory;
    description?: string;
    checklistItems?: ChecklistItem[];
    scheduledAt?: string;
    inspector?: string;
    targetZone?: string;
    constructionPlanId?: string;
    contentInstallationId?: string;
  }) => apiClient.post<QualityInspection>('/quality-inspections', data),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    checklistItems: ChecklistItem[];
    scheduledAt: string;
    inspector: string;
    targetZone: string;
    overallComment: string;
  }>) => apiClient.patch<QualityInspection>(`/quality-inspections/${id}`, data),

  start:           (id: string) =>
    apiClient.post<QualityInspection>(`/quality-inspections/${id}/start`, {}),
  complete:        (id: string, data: { inspector: string; finalResult: 'pass' | 'fail' | 'conditional_pass'; overallComment?: string }) =>
    apiClient.post<QualityInspection>(`/quality-inspections/${id}/complete`, data),
  resolveDefect:   (id: string, defectId: string, resolution: string) =>
    apiClient.post<QualityInspection>(`/quality-inspections/${id}/defects/${defectId}/resolve`, { resolution }),
  markReInspected: (id: string, inspector: string) =>
    apiClient.post<QualityInspection>(`/quality-inspections/${id}/re-inspect`, { inspector }),

  remove: (id: string) =>
    apiClient.delete<void>(`/quality-inspections/${id}`),
};

// ─────────────────────────────────────────────────────────
// 5. 통합 테스트 (IntegrationTest) — 컨펌 게이트 #4
// ─────────────────────────────────────────────────────────
export type IntegrationTestStatus =
  | 'preparing' | 'in_simulation' | 'in_review' | 'client_review' | 'approved' | 'rejected';

export interface Phase4Deliverable {
  teamName: string;
  deliverableType: 'construction_plan' | 'site_visualization' | 'content_installation' | 'quality_inspection';
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  inspectionResult?: string;
  notes?: string;
}

export interface SimulationStep {
  stepNo: number;
  zone: string;
  action: string;
  expectedResult: string;
  actualResult?: string;
  result?: 'pass' | 'fail' | 'partial';
  testerNote?: string;
}

export interface SimulationScenario {
  scenarioId: string;
  name: string;
  description: string;
  targetAudience: string;
  steps: SimulationStep[];
  totalSteps: number;
  passedSteps: number;
  overallResult?: 'pass' | 'fail' | 'partial';
  simulatedAt?: string;
  simulatedBy?: string;
}

export interface FinalCheckItem {
  checkId: string;
  category: string;
  description: string;
  result: 'pass' | 'fail' | 'na' | 'pending';
  note?: string;
}

export interface OperationIssue {
  issueId: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  status: 'open' | 'resolved';
  resolution?: string;
}

export interface IntegrationTest {
  id: string;
  projectId: string;
  title: string;
  executiveSummary?: string;
  status: IntegrationTestStatus;
  deliverables: Phase4Deliverable[];
  simulations: SimulationScenario[];
  finalChecklist: FinalCheckItem[];
  operationIssues: OperationIssue[];
  simulationResult?: string;
  isFullyPassed?: boolean;
  clientFeedback?: string;
  internalNotes?: string;
  version: number;
  constructionPlanId?: string;
  contentInstallationId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const integrationTestsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: IntegrationTestStatus }) =>
    fetchPaginated<IntegrationTest>('/integration-tests', params),

  get: (id: string) =>
    apiClient.get<IntegrationTest>(`/integration-tests/${id}`),

  create: (data: {
    projectId: string;
    title: string;
    executiveSummary?: string;
    constructionPlanId?: string;
    contentInstallationId?: string;
    internalNotes?: string;
  }) => apiClient.post<IntegrationTest>('/integration-tests', data),

  update: (id: string, data: Partial<{
    title: string;
    executiveSummary: string;
    deliverables: Phase4Deliverable[];
    simulations: SimulationScenario[];
    finalChecklist: FinalCheckItem[];
    operationIssues: OperationIssue[];
    internalNotes: string;
  }>) => apiClient.patch<IntegrationTest>(`/integration-tests/${id}`, data),

  startSimulation: (id: string) =>
    apiClient.post<IntegrationTest>(`/integration-tests/${id}/start-simulation`, {}),
  runSimulation:   (id: string, data: {
    simulatedBy: string;
    scenarioResults: Array<{
      scenarioId: string;
      overallResult: 'pass' | 'fail' | 'partial';
      stepResults?: Array<{ stepNo: number; result: 'pass' | 'fail' | 'partial'; actualResult?: string; testerNote?: string }>;
    }>;
  }) => apiClient.post<IntegrationTest>(`/integration-tests/${id}/run-simulation`, data),
  submitForReview: (id: string) =>
    apiClient.post<IntegrationTest>(`/integration-tests/${id}/submit-review`, {}),
  submitToClient:  (id: string) =>
    apiClient.post<IntegrationTest>(`/integration-tests/${id}/submit-client`, {}),
  approve:         (id: string, data: { approvedBy: string; clientFeedback?: string }) =>
    apiClient.post<IntegrationTest>(`/integration-tests/${id}/approve`, data),
  reject:          (id: string, feedback: string) =>
    apiClient.post<IntegrationTest>(`/integration-tests/${id}/reject`, { feedback }),

  remove: (id: string) =>
    apiClient.delete<void>(`/integration-tests/${id}`),
};
