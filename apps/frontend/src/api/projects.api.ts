import { fetchPaginated, apiClient } from './client';
import { PaginationInput, PaginatedResponse } from '../types/pagination';

export interface Project {
  id: string;
  name: string;
  description?: string;
  phase: number;
  status: string;
  clientName?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  confirmGates: Record<string, { confirmedAt: string; confirmedBy: string }>;
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  /** 프로젝트 목록 — 인풋 기반 페이징 */
  list: (input: PaginationInput & { status?: string; phase?: number }): Promise<PaginatedResponse<Project>> => {
    const extra: Record<string, string> = {};
    if (input.status !== undefined) extra.status = input.status;
    if (input.phase  !== undefined) extra.phase  = String(input.phase);
    return fetchPaginated<Project>('/api/v1/projects', input, extra);
  },

  /** 단일 프로젝트 조회 */
  get: async (id: string): Promise<Project> => {
    const res = await apiClient.get<Project>(`/api/v1/projects/${id}`);
    return res.data;
  },

  /** 프로젝트 생성 */
  create: async (data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.post<Project>('/api/v1/projects', data);
    return res.data;
  },

  /** 컨펌 게이트 처리 */
  confirmGate: async (id: string, phase: number, confirmedBy: string): Promise<Project> => {
    const res = await apiClient.patch<Project>(`/api/v1/projects/${id}/phases/${phase}/confirm`, { confirmedBy });
    return res.data;
  },
};
