/**
 * GWONS_CREATIVE — useInfiniteScroll Hook
 * Intersection Observer 기반 무한 스크롤
 * useCursorPagination과 조합하여 사용
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** 더 불러올 콜백 */
  onLoadMore: () => void;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
  /** 로딩 중 여부 */
  loading: boolean;
  /** 루트 마진 (미리 로드 트리거 거리) */
  rootMargin?: string;
  /** 임계값 (0.0 ~ 1.0) */
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  rootMargin = '200px',
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersect, rootMargin, threshold]);

  return { sentinelRef };
}
