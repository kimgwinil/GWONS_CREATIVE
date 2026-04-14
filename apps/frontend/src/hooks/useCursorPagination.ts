/**
 * GWONS_CREATIVE — useCursorPagination Hook
 * 인풋(커서) 기반 페이징 React 훅
 * 무한 스크롤 및 앞/뒤 방향 탐색 지원
 */
import { useState, useCallback, useRef } from 'react';
import { PaginationInput, PaginatedResponse, PageInfo } from '../types/pagination';

interface UseCursorPaginationOptions<T> {
  fetchFn: (input: PaginationInput) => Promise<PaginatedResponse<T>>;
  limit?: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  initialFilter?: Record<string, unknown>;
}

interface UseCursorPaginationReturn<T> {
  /** 현재까지 로드된 아이템 목록 */
  items: T[];
  /** 페이지 메타 정보 */
  pageInfo: PageInfo | null;
  /** 다음 페이지 로드 */
  loadNext: () => Promise<void>;
  /** 이전 페이지 로드 */
  loadPrev: () => Promise<void>;
  /** 전체 초기화 후 첫 페이지 재로드 */
  reset: () => Promise<void>;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 */
  error: Error | null;
  /** 다음 페이지 존재 여부 */
  hasNextPage: boolean;
  /** 이전 페이지 존재 여부 */
  hasPreviousPage: boolean;
}

export function useCursorPagination<T>({
  fetchFn,
  limit = 20,
  sortField = 'createdAt',
  sortOrder = 'DESC',
  initialFilter = {},
}: UseCursorPaginationOptions<T>): UseCursorPaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 커서 히스토리 스택 (뒤로 가기 지원)
  const cursorHistory = useRef<string[]>([]);

  const fetchPage = useCallback(
    async (input: PaginationInput, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFn({
          ...input,
          limit,
          sortField,
          sortOrder,
        });

        if (append) {
          // 무한 스크롤 모드: 기존 아이템에 추가
          setItems((prev) => [...prev, ...response.data]);
        } else {
          // 페이지 교체 모드
          setItems(response.data);
        }
        setPageInfo(response.pageInfo);
        return response.pageInfo;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, limit, sortField, sortOrder],
  );

  /** 다음 페이지 로드 (endCursor 사용) */
  const loadNext = useCallback(async () => {
    if (!pageInfo?.hasNextPage || loading) return;
    // 현재 endCursor를 히스토리에 저장 (뒤로 가기용)
    if (pageInfo.endCursor) {
      cursorHistory.current.push(pageInfo.startCursor);
    }
    await fetchPage({ cursor: pageInfo.endCursor, direction: 'next' }, true);
  }, [pageInfo, loading, fetchPage]);

  /** 이전 페이지 로드 (히스토리 스택 활용) */
  const loadPrev = useCallback(async () => {
    if (!pageInfo?.hasPreviousPage || loading) return;
    const prevCursor = cursorHistory.current.pop();
    await fetchPage({ cursor: prevCursor, direction: 'prev' }, false);
  }, [pageInfo, loading, fetchPage]);

  /** 리셋 및 첫 페이지 재로드 */
  const reset = useCallback(async () => {
    cursorHistory.current = [];
    setItems([]);
    setPageInfo(null);
    await fetchPage({ direction: 'next' }, false);
  }, [fetchPage]);

  return {
    items,
    pageInfo,
    loadNext,
    loadPrev,
    reset,
    loading,
    error,
    hasNextPage: pageInfo?.hasNextPage ?? false,
    hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
  };
}
