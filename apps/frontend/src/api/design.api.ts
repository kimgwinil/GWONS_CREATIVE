/**
 * GWONS_CREATIVE — Phase 2 Design API Client
 * 설계 단계 모든 팀 API (기획팀·3D팀·2D팀·조달팀) 통합
 * 인풋 기반 커서 페이징 사용
 */
import { apiClient } from './client';
import type { PaginationInput, PaginatedResponse } from '../types/pagination';

// ══════════════════════════════════════════════════════════════
// 공통 타입
// ══════════════════════════════════════════════════════════════
export type DesignStatus =
  | 'draft' | 'in_review' | 'approved' | 'distributed' | 'final' | 'rejected';

// ══════════════════════════════════════════════════════════════
// 1. 기본설계서 (BasicDesign) — 기획팀
// ══════════════════════════════════════════════════════════════
export interface SpaceProgram {
  zoneName: string;
  areaRatio: number;
  function: string;
  requirements?: string[];
}

export interface SystemRequirement {
  system: string;
  requirement: string;
  priority: 'must' | 'should' | 'nice';
}

export interface BasicDesign {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved' | 'distributed';
  designCriteria: string[];
  spacePrograms: SpaceProgram[];
  systemRequirements: SystemRequirement[];
  totalFloorAreaSqm?: number;
  totalFloors: number;
  version: number;
  distributedAt?: string;
  integratedPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBasicDesignDto {
  projectId: string;
  title: string;
  description?: string;
  spacePrograms?: SpaceProgram[];
  systemRequirements?: SystemRequirement[];
  totalFloorAreaSqm?: number;
  totalFloors?: number;
  integratedPlanId?: string;
}

export const basicDesignsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: string }): Promise<PaginatedResponse<BasicDesign>> =>
    apiClient.get('/basic-designs', { params }),

  get: (id: string): Promise<BasicDesign> =>
    apiClient.get(`/basic-designs/${id}`).then(r => r.data),

  create: (dto: CreateBasicDesignDto): Promise<BasicDesign> =>
    apiClient.post('/basic-designs', dto).then(r => r.data),

  update: (id: string, dto: Partial<CreateBasicDesignDto>): Promise<BasicDesign> =>
    apiClient.patch(`/basic-designs/${id}`, dto).then(r => r.data),

  submitForReview: (id: string): Promise<BasicDesign> =>
    apiClient.post(`/basic-designs/${id}/submit-for-review`).then(r => r.data),

  approve: (id: string): Promise<BasicDesign> =>
    apiClient.post(`/basic-designs/${id}/approve`).then(r => r.data),

  /** 각 팀에 배포 → Phase 2 병렬 작업 시작 트리거 */
  distribute: (id: string): Promise<BasicDesign> =>
    apiClient.post(`/basic-designs/${id}/distribute`).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/basic-designs/${id}`).then(() => undefined),
};

// ══════════════════════════════════════════════════════════════
// 2. 상세설계서 (DetailDesign) — 기획팀
// ══════════════════════════════════════════════════════════════
export interface FinishSpec {
  zone: string;
  material: string;
  finish: string;
  supplier?: string;
}

export interface EquipmentSpec {
  equipmentName: string;
  quantity: number;
  spec: string;
  manufacturer?: string;
  modelNo?: string;
}

export interface ContentSpec {
  contentId: string;
  contentType: string;
  duration?: number;
  interactionType?: string;
  displayDevice?: string;
}

export interface DetailDesign {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved' | 'final';
  finishSpecs: FinishSpec[];
  equipmentSpecs: EquipmentSpec[];
  contentSpecs: ContentSpec[];
  totalPowerKw?: number;
  estimatedConstructionCost?: number;
  version: number;
  approvedBy?: string;
  approvedAt?: string;
  basicDesignId?: string;
  createdAt: string;
  updatedAt: string;
}

export const detailDesignsApi = {
  list: (params: PaginationInput & { projectId?: string; status?: string }): Promise<PaginatedResponse<DetailDesign>> =>
    apiClient.get('/detail-designs', { params }),

  get: (id: string): Promise<DetailDesign> =>
    apiClient.get(`/detail-designs/${id}`).then(r => r.data),

  create: (dto: {
    projectId: string;
    title: string;
    basicDesignId?: string;
    finishSpecs?: FinishSpec[];
    equipmentSpecs?: EquipmentSpec[];
    contentSpecs?: ContentSpec[];
    totalPowerKw?: number;
    estimatedConstructionCost?: number;
  }): Promise<DetailDesign> =>
    apiClient.post('/detail-designs', dto).then(r => r.data),

  update: (id: string, dto: Record<string, unknown>): Promise<DetailDesign> =>
    apiClient.patch(`/detail-designs/${id}`, dto).then(r => r.data),

  submitForReview: (id: string): Promise<DetailDesign> =>
    apiClient.post(`/detail-designs/${id}/submit-for-review`).then(r => r.data),

  approve: (id: string, approvedBy: string): Promise<DetailDesign> =>
    apiClient.post(`/detail-designs/${id}/approve`, { approvedBy }).then(r => r.data),

  finalize: (id: string): Promise<DetailDesign> =>
    apiClient.post(`/detail-designs/${id}/finalize`).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/detail-designs/${id}`).then(() => undefined),
};

// ══════════════════════════════════════════════════════════════
// 3. 렌더 에셋 (RenderAsset) — 3D 디자인팀
// ══════════════════════════════════════════════════════════════
export type RenderAssetStatus = 'modeling' | 'rendering' | 'review' | 'approved' | 'final';
export type RenderAssetType = 'model_3d' | 'render_img' | 'animation' | 'vr_scene' | 'panorama';
export type RenderViewType = 'exterior' | 'interior' | 'birds_eye' | 'detail' | 'walkthrough';

export interface RenderAsset {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assetType: RenderAssetType;
  viewType?: RenderViewType;
  status: RenderAssetStatus;
  sourceFileUrl?: string;
  outputFileUrl?: string;
  thumbnailUrl?: string;
  fileFormat?: string;
  fileSizeBytes?: number;
  lodLevel?: string;
  renderSettings?: {
    resolution: string;
    engine: string;
    samples?: number;
  };
  targetZoneId?: string;
  version: number;
  createdBy?: string;
  reviewNotes?: string;
  basicDesignId?: string;
  createdAt: string;
  updatedAt: string;
}

export const renderAssetsApi = {
  list: (params: PaginationInput & {
    projectId?: string;
    assetType?: RenderAssetType;
    viewType?: RenderViewType;
    status?: RenderAssetStatus;
  }): Promise<PaginatedResponse<RenderAsset>> =>
    apiClient.get('/render-assets', { params }),

  get: (id: string): Promise<RenderAsset> =>
    apiClient.get(`/render-assets/${id}`).then(r => r.data),

  create: (dto: {
    projectId: string;
    title: string;
    assetType: RenderAssetType;
    viewType?: RenderViewType;
    sourceFileUrl?: string;
    basicDesignId?: string;
    createdBy?: string;
  }): Promise<RenderAsset> =>
    apiClient.post('/render-assets', dto).then(r => r.data),

  update: (id: string, dto: Record<string, unknown>): Promise<RenderAsset> =>
    apiClient.patch(`/render-assets/${id}`, dto).then(r => r.data),

  /** 모델링 → 렌더링 시작 */
  startRendering: (id: string): Promise<RenderAsset> =>
    apiClient.post(`/render-assets/${id}/start-rendering`).then(r => r.data),

  /** 렌더링 완료 → 검토 요청 */
  submitForReview: (id: string, outputFileUrl: string, thumbnailUrl?: string): Promise<RenderAsset> =>
    apiClient.post(`/render-assets/${id}/submit-for-review`, { outputFileUrl, thumbnailUrl }).then(r => r.data),

  /** 기획팀 승인 */
  approve: (id: string, reviewNotes?: string): Promise<RenderAsset> =>
    apiClient.post(`/render-assets/${id}/approve`, { reviewNotes }).then(r => r.data),

  /** 최종본 확정 */
  finalize: (id: string): Promise<RenderAsset> =>
    apiClient.post(`/render-assets/${id}/finalize`).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/render-assets/${id}`).then(() => undefined),
};

// ══════════════════════════════════════════════════════════════
// 4. CAD 도면 (CadDrawing) — 2D 디자인팀
// ══════════════════════════════════════════════════════════════
export type DrawingStatus = 'draft' | 'in_review' | 'approved' | 'issued' | 'revised';
export type DrawingDiscipline =
  | 'architectural' | 'structural' | 'mechanical'
  | 'electrical' | 'it_network' | 'interior' | 'av_system' | 'lighting';
export type DrawingType =
  | 'plan' | 'elevation' | 'section' | 'detail' | 'schedule' | 'diagram' | 'site_plan';

export interface RevisionHistory {
  revisionNo: string;
  date: string;
  description: string;
  revisedBy: string;
  checkedBy?: string;
}

export interface CadDrawing {
  id: string;
  projectId: string;
  drawingNo: string;
  title: string;
  description?: string;
  discipline: DrawingDiscipline;
  drawingType: DrawingType;
  status: DrawingStatus;
  scale?: string;
  paperSize?: string;
  floorNumber: number;
  fileUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  currentRevision: string;
  revisionHistory: RevisionHistory[];
  drawnBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  issuedAt?: string;
  basicDesignId?: string;
  createdAt: string;
  updatedAt: string;
}

export const cadDrawingsApi = {
  list: (params: PaginationInput & {
    projectId?: string;
    discipline?: DrawingDiscipline;
    drawingType?: DrawingType;
    status?: DrawingStatus;
    floorNumber?: number;
  }): Promise<PaginatedResponse<CadDrawing>> =>
    apiClient.get('/cad-drawings', { params }),

  get: (id: string): Promise<CadDrawing> =>
    apiClient.get(`/cad-drawings/${id}`).then(r => r.data),

  create: (dto: {
    projectId: string;
    drawingNo: string;
    title: string;
    discipline: DrawingDiscipline;
    drawingType: DrawingType;
    scale?: string;
    paperSize?: string;
    floorNumber?: number;
    drawnBy?: string;
    basicDesignId?: string;
  }): Promise<CadDrawing> =>
    apiClient.post('/cad-drawings', dto).then(r => r.data),

  update: (id: string, dto: Record<string, unknown>): Promise<CadDrawing> =>
    apiClient.patch(`/cad-drawings/${id}`, dto).then(r => r.data),

  submitForReview: (id: string): Promise<CadDrawing> =>
    apiClient.post(`/cad-drawings/${id}/submit-for-review`).then(r => r.data),

  approve: (id: string, approvedBy: string): Promise<CadDrawing> =>
    apiClient.post(`/cad-drawings/${id}/approve`, { approvedBy }).then(r => r.data),

  /** 시공용 도면 발행 */
  issue: (id: string, revisionDescription: string, approvedBy: string): Promise<CadDrawing> =>
    apiClient.post(`/cad-drawings/${id}/issue`, { revisionDescription, approvedBy }).then(r => r.data),

  requestRevision: (id: string, reason: string): Promise<CadDrawing> =>
    apiClient.post(`/cad-drawings/${id}/request-revision`, { reason }).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/cad-drawings/${id}`).then(() => undefined),
};

// ══════════════════════════════════════════════════════════════
// 5. 시장조사 (MarketResearch) — 조달팀
// ══════════════════════════════════════════════════════════════
export type ResearchStatus = 'open' | 'completed' | 'reviewed' | 'approved';
export type ResearchCategory =
  | 'display' | 'sensor' | 'computing' | 'structure'
  | 'audio' | 'lighting_hw' | 'software_lic' | 'content_dev'
  | 'installation' | 'maintenance';

export interface VendorQuote {
  vendorName: string;
  vendorContact?: string;
  unitPrice: number;
  totalPrice: number;
  currency: 'KRW' | 'USD' | 'EUR';
  leadTimeDays: number;
  warrantyMonths?: number;
  isCustomizable: boolean;
  customizationDetails?: string;
  notes?: string;
  quotedAt: string;
}

export interface MarketResearch {
  id: string;
  projectId: string;
  itemName: string;
  description?: string;
  category: ResearchCategory;
  status: ResearchStatus;
  quantity: number;
  unit?: string;
  vendorQuotes: VendorQuote[];
  recommendedVendor?: string;
  recommendationReason?: string;
  isCustomizable: boolean;
  customizationSpec?: string;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  researchedBy?: string;
  contentSpecRef?: string;
  createdAt: string;
  updatedAt: string;
}

export const marketResearchesApi = {
  list: (params: PaginationInput & {
    projectId?: string;
    category?: ResearchCategory;
    status?: ResearchStatus;
  }): Promise<PaginatedResponse<MarketResearch>> =>
    apiClient.get('/market-researches', { params }),

  get: (id: string): Promise<MarketResearch> =>
    apiClient.get(`/market-researches/${id}`).then(r => r.data),

  create: (dto: {
    projectId: string;
    itemName: string;
    category: ResearchCategory;
    quantity?: number;
    unit?: string;
    researchedBy?: string;
  }): Promise<MarketResearch> =>
    apiClient.post('/market-researches', dto).then(r => r.data),

  update: (id: string, dto: Record<string, unknown>): Promise<MarketResearch> =>
    apiClient.patch(`/market-researches/${id}`, dto).then(r => r.data),

  /** 조사 완료 (견적 + 추천공급처 필수) */
  complete: (id: string): Promise<MarketResearch> =>
    apiClient.post(`/market-researches/${id}/complete`).then(r => r.data),

  /** 기획팀 검토 완료 */
  review: (id: string): Promise<MarketResearch> =>
    apiClient.post(`/market-researches/${id}/review`).then(r => r.data),

  /** 조달 목록 반영 승인 */
  approve: (id: string): Promise<MarketResearch> =>
    apiClient.post(`/market-researches/${id}/approve`).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/market-researches/${id}`).then(() => undefined),
};

// ══════════════════════════════════════════════════════════════
// 6. 설계 통합 검토 (DesignReview) — 기획팀 합류 + 컨펌 게이트 #2
// ══════════════════════════════════════════════════════════════
export type DesignReviewStatus =
  | 'collecting' | 'in_review' | 'client_review' | 'approved' | 'rejected';

export interface Phase2Deliverable {
  teamName: string;
  deliverableType: string;
  deliverableId: string;
  deliverableTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  reviewComment?: string;
}

export interface DesignIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  assignedTo: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
}

export interface DesignReview {
  id: string;
  projectId: string;
  title: string;
  executiveSummary?: string;
  status: DesignReviewStatus;
  deliverables: Phase2Deliverable[];
  designIssues: DesignIssue[];
  basicDesignId?: string;
  detailDesignId?: string;
  renderAssetId?: string;
  cadDrawingId?: string;
  marketResearchId?: string;
  version: number;
  clientFeedback?: string;
  internalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const designReviewsApi = {
  list: (params: PaginationInput & {
    projectId?: string;
    status?: DesignReviewStatus;
  }): Promise<PaginatedResponse<DesignReview>> =>
    apiClient.get('/design-reviews', { params }),

  get: (id: string): Promise<DesignReview> =>
    apiClient.get(`/design-reviews/${id}`).then(r => r.data),

  create: (dto: {
    projectId: string;
    title: string;
    executiveSummary?: string;
    basicDesignId?: string;
    detailDesignId?: string;
    renderAssetId?: string;
    cadDrawingId?: string;
    marketResearchId?: string;
  }): Promise<DesignReview> =>
    apiClient.post('/design-reviews', dto).then(r => r.data),

  update: (id: string, dto: Record<string, unknown>): Promise<DesignReview> =>
    apiClient.patch(`/design-reviews/${id}`, dto).then(r => r.data),

  /** 산출물 수집 완료 → 통합 검토 요청 */
  submitForReview: (id: string): Promise<DesignReview> =>
    apiClient.post(`/design-reviews/${id}/submit-for-review`).then(r => r.data),

  /** 내부 검토 → 클라이언트 제출 */
  submitToClient: (id: string): Promise<DesignReview> =>
    apiClient.post(`/design-reviews/${id}/submit-to-client`).then(r => r.data),

  /** 컨펌 게이트 #2 — 클라이언트 최종 승인 */
  approve: (id: string, approvedBy: string, clientFeedback?: string): Promise<DesignReview> =>
    apiClient.post(`/design-reviews/${id}/approve`, { approvedBy, clientFeedback }).then(r => r.data),

  /** 반려 */
  reject: (id: string, feedback: string): Promise<DesignReview> =>
    apiClient.post(`/design-reviews/${id}/reject`, { feedback }).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/design-reviews/${id}`).then(() => undefined),
};
