/**
 * GWONS_CREATIVE — API Client
 * Axios 기반 HTTP 클라이언트 + 인풋 기반 페이징 파라미터 직렬화
 */
import axios, { AxiosInstance } from 'axios';
import { PaginationInput, PaginatedResponse } from '../types/pagination';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// 응답 인터셉터 - 공통 에러 처리
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다.';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  },
);

/**
 * 인풋 기반 페이징 쿼리 파라미터 생성 유틸
 */
export function buildPaginationParams(input: PaginationInput): Record<string, string> {
  const params: Record<string, string> = {};
  if (input.cursor)    params.cursor    = input.cursor;
  if (input.limit)     params.limit     = String(input.limit);
  if (input.direction) params.direction = input.direction;
  if (input.sortField) params.sortField = input.sortField;
  if (input.sortOrder) params.sortOrder = input.sortOrder;
  return params;
}

/**
 * 공통 페이징 GET 요청 헬퍼
 */
export async function fetchPaginated<T>(
  path: string,
  input: PaginationInput,
  extraParams?: Record<string, string>,
): Promise<PaginatedResponse<T>> {
  const params = { ...buildPaginationParams(input), ...extraParams };
  const res = await apiClient.get<PaginatedResponse<T>>(path, { params });
  return res.data;
}
