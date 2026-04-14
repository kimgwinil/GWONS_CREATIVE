/**
 * GWONS_CREATIVE — Planning API
 * Phase 1 기획 관련 API: 시나리오, 콘셉트 기획서, 무드보드, 레이아웃 스케치, 통합 기획서
 */
import { fetchPaginated, apiClient } from './client';
import { PaginationInput, PaginatedResponse } from '../types/pagination';

// ── 시나리오 ──────────────────────────────────────────────
export interface Scenario {
  id: string; projectId: string; title: string;
  type: string; status: string;
  steps: Array<{ order: number; title: string; durationMinutes: number; location: string; interactionType: string }>;
  totalDurationMinutes?: number; targetAudience?: string; maxCapacity?: number;
  approvedBy?: string; approvedAt?: string;
  createdAt: string; updatedAt: string;
}

export const scenariosApi = {
  list: (input: PaginationInput & { projectId?: string; type?: string; status?: string }): Promise<PaginatedResponse<Scenario>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.type)      extra.type      = input.type;
    if (input.status)    extra.status    = input.status;
    return fetchPaginated<Scenario>('/api/v1/scenarios', input, extra);
  },
  get:             (id: string)             => apiClient.get<Scenario>(`/api/v1/scenarios/${id}`).then(r => r.data),
  create:          (data: Partial<Scenario>) => apiClient.post<Scenario>('/api/v1/scenarios', data).then(r => r.data),
  update:          (id: string, data: any)   => apiClient.put<Scenario>(`/api/v1/scenarios/${id}`, data).then(r => r.data),
  submitForReview: (id: string)             => apiClient.patch<Scenario>(`/api/v1/scenarios/${id}/review`).then(r => r.data),
  approve:         (id: string, data: any)   => apiClient.patch<Scenario>(`/api/v1/scenarios/${id}/approve`, data).then(r => r.data),
};

// ── 콘셉트 기획서 ─────────────────────────────────────────
export interface ConceptPlan {
  id: string; projectId: string; title: string;
  theme: string; status: string; version: number;
  conceptStatement?: string; objectives?: string; targetAudience?: string;
  circulationZones: any[]; experienceElements: any[];
  totalAreaSqm?: number; approvedBy?: string; approvedAt?: string;
  createdAt: string; updatedAt: string;
}

export const conceptPlansApi = {
  list: (input: PaginationInput & { projectId?: string; theme?: string; status?: string }): Promise<PaginatedResponse<ConceptPlan>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.theme)     extra.theme     = input.theme;
    if (input.status)    extra.status    = input.status;
    return fetchPaginated<ConceptPlan>('/api/v1/concept-plans', input, extra);
  },
  get:             (id: string)              => apiClient.get<ConceptPlan>(`/api/v1/concept-plans/${id}`).then(r => r.data),
  create:          (data: Partial<ConceptPlan>) => apiClient.post<ConceptPlan>('/api/v1/concept-plans', data).then(r => r.data),
  update:          (id: string, data: any)    => apiClient.put<ConceptPlan>(`/api/v1/concept-plans/${id}`, data).then(r => r.data),
  submitForReview: (id: string)              => apiClient.patch<ConceptPlan>(`/api/v1/concept-plans/${id}/review`).then(r => r.data),
  approve:         (id: string, data: any)    => apiClient.patch<ConceptPlan>(`/api/v1/concept-plans/${id}/approve`, data).then(r => r.data),
  finalize:        (id: string)              => apiClient.patch<ConceptPlan>(`/api/v1/concept-plans/${id}/finalize`).then(r => r.data),
};

// ── 무드보드 (3D팀) ───────────────────────────────────────
export interface Moodboard {
  id: string; projectId: string; title: string;
  mood: string; status: string;
  references: any[]; colorPalette: any[]; materialKeywords: string[];
  lightingConcept?: string; createdBy?: string;
  createdAt: string; updatedAt: string;
}

export const moodboardsApi = {
  list: (input: PaginationInput & { projectId?: string; mood?: string; status?: string }): Promise<PaginatedResponse<Moodboard>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.mood)      extra.mood      = input.mood;
    if (input.status)    extra.status    = input.status;
    return fetchPaginated<Moodboard>('/api/v1/moodboards', input, extra);
  },
  get:     (id: string)              => apiClient.get<Moodboard>(`/api/v1/moodboards/${id}`).then(r => r.data),
  create:  (data: Partial<Moodboard>) => apiClient.post<Moodboard>('/api/v1/moodboards', data).then(r => r.data),
  update:  (id: string, data: any)    => apiClient.put<Moodboard>(`/api/v1/moodboards/${id}`, data).then(r => r.data),
  share:   (id: string)              => apiClient.patch<Moodboard>(`/api/v1/moodboards/${id}/share`).then(r => r.data),
  approve: (id: string)              => apiClient.patch<Moodboard>(`/api/v1/moodboards/${id}/approve`).then(r => r.data),
};

// ── 레이아웃 스케치 (2D팀) ───────────────────────────────
export interface LayoutSketch {
  id: string; projectId: string; title: string;
  sketchType: string; status: string; version: number;
  fileUrl?: string; thumbnailUrl?: string;
  zones: any[]; dimensions?: any; floorNumber: number;
  revisionNotes?: string; createdBy?: string;
  createdAt: string; updatedAt: string;
}

export const layoutSketchesApi = {
  list: (input: PaginationInput & { projectId?: string; sketchType?: string; status?: string }): Promise<PaginatedResponse<LayoutSketch>> => {
    const extra: Record<string, string> = {};
    if (input.projectId)  extra.projectId  = input.projectId;
    if (input.sketchType) extra.sketchType = input.sketchType;
    if (input.status)     extra.status     = input.status;
    return fetchPaginated<LayoutSketch>('/api/v1/layout-sketches', input, extra);
  },
  get:             (id: string)               => apiClient.get<LayoutSketch>(`/api/v1/layout-sketches/${id}`).then(r => r.data),
  create:          (data: Partial<LayoutSketch>) => apiClient.post<LayoutSketch>('/api/v1/layout-sketches', data).then(r => r.data),
  update:          (id: string, data: any)     => apiClient.put<LayoutSketch>(`/api/v1/layout-sketches/${id}`, data).then(r => r.data),
  share:           (id: string)               => apiClient.patch<LayoutSketch>(`/api/v1/layout-sketches/${id}/share`).then(r => r.data),
  approve:         (id: string)               => apiClient.patch<LayoutSketch>(`/api/v1/layout-sketches/${id}/approve`).then(r => r.data),
  requestRevision: (id: string, notes: string) => apiClient.patch<LayoutSketch>(`/api/v1/layout-sketches/${id}/revision`, { notes }).then(r => r.data),
};

// ── 통합 기획서 ──────────────────────────────────────────
export interface IntegratedPlan {
  id: string; projectId: string; title: string;
  status: string; version: number;
  executiveSummary?: string;
  deliverables: Array<{ teamName: string; deliverableType: string; deliverableTitle: string; isCompleted: boolean }>;
  conceptPlanId?: string; scenarioId?: string; moodboardId?: string; layoutSketchId?: string;
  approvedBy?: string; approvedAt?: string; clientFeedback?: string;
  createdAt: string; updatedAt: string;
}

export const integratedPlansApi = {
  list: (input: PaginationInput & { projectId?: string; status?: string }): Promise<PaginatedResponse<IntegratedPlan>> => {
    const extra: Record<string, string> = {};
    if (input.projectId) extra.projectId = input.projectId;
    if (input.status)    extra.status    = input.status;
    return fetchPaginated<IntegratedPlan>('/api/v1/integrated-plans', input, extra);
  },
  get:              (id: string)                  => apiClient.get<IntegratedPlan>(`/api/v1/integrated-plans/${id}`).then(r => r.data),
  create:           (data: Partial<IntegratedPlan>) => apiClient.post<IntegratedPlan>('/api/v1/integrated-plans', data).then(r => r.data),
  update:           (id: string, data: any)         => apiClient.put<IntegratedPlan>(`/api/v1/integrated-plans/${id}`, data).then(r => r.data),
  submitForReview:  (id: string)                  => apiClient.patch<IntegratedPlan>(`/api/v1/integrated-plans/${id}/review`).then(r => r.data),
  submitToClient:   (id: string)                  => apiClient.patch<IntegratedPlan>(`/api/v1/integrated-plans/${id}/client-review`).then(r => r.data),
  approve:          (id: string, data: any)         => apiClient.patch<IntegratedPlan>(`/api/v1/integrated-plans/${id}/approve`, data).then(r => r.data),
  reject:           (id: string, feedback: string)  => apiClient.patch<IntegratedPlan>(`/api/v1/integrated-plans/${id}/reject`, { feedback }).then(r => r.data),
};
