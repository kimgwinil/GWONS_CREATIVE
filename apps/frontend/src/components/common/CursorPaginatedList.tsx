/**
 * GWONS_CREATIVE — CursorPaginatedList Component
 * 인풋 기반 페이징 + 무한 스크롤 범용 컴포넌트
 */
import React, { useEffect } from 'react';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { PaginationInput, PaginatedResponse } from '../../types/pagination';

interface CursorPaginatedListProps<T> {
  /** 데이터 페칭 함수 */
  fetchFn: (input: PaginationInput) => Promise<PaginatedResponse<T>>;
  /** 각 아이템을 렌더링하는 함수 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 고유 키 추출 함수 */
  keyExtractor: (item: T) => string;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 필드 */
  sortField?: string;
  /** 정렬 방향 */
  sortOrder?: 'ASC' | 'DESC';
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 로딩 스켈레톤 컴포넌트 */
  loadingComponent?: React.ReactNode;
  /** 에러 컴포넌트 */
  errorComponent?: (error: Error) => React.ReactNode;
  /** 컨테이너 className */
  className?: string;
  /** 자동 무한 스크롤 여부 (false면 버튼 클릭으로 로드) */
  infiniteScroll?: boolean;
  /** 초기 로드 여부 */
  autoLoad?: boolean;
}

export function CursorPaginatedList<T>({
  fetchFn,
  renderItem,
  keyExtractor,
  limit = 20,
  sortField = 'createdAt',
  sortOrder = 'DESC',
  emptyMessage = '항목이 없습니다.',
  loadingComponent,
  errorComponent,
  className = '',
  infiniteScroll = true,
  autoLoad = true,
}: CursorPaginatedListProps<T>) {
  const {
    items, pageInfo, loadNext, reset,
    loading, error, hasNextPage,
  } = useCursorPagination({ fetchFn, limit, sortField, sortOrder });

  // 초기 로드
  useEffect(() => {
    if (autoLoad) reset();
  }, []);  // eslint-disable-line

  // 무한 스크롤 센티넬
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadNext,
    hasMore: hasNextPage,
    loading,
  });

  const defaultLoading = (
    <div className="gwons-loading">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="gwons-skeleton" style={{
          height: 80, borderRadius: 8, marginBottom: 12,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
    </div>
  );

  if (error && errorComponent) return <>{errorComponent(error)}</>;
  if (error) return (
    <div className="gwons-error" style={{ color: '#e53e3e', padding: 16 }}>
      ⚠️ 오류: {error.message}
      <button onClick={reset} style={{ marginLeft: 8 }}>재시도</button>
    </div>
  );

  return (
    <div className={`gwons-paginated-list ${className}`}>
      {/* 아이템 목록 */}
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor(item)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}

      {/* 빈 상태 */}
      {!loading && items.length === 0 && (
        <div className="gwons-empty" style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          {emptyMessage}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (loadingComponent ?? defaultLoading)}

      {/* 페이지 정보 */}
      {pageInfo?.totalCount !== undefined && (
        <div className="gwons-page-info" style={{ fontSize: 12, color: '#999', textAlign: 'right', marginTop: 8 }}>
          {items.length} / {pageInfo.totalCount}개
        </div>
      )}

      {/* 무한 스크롤 센티넬 or 더보기 버튼 */}
      {infiniteScroll ? (
        <div ref={sentinelRef} style={{ height: 1 }} />
      ) : (
        hasNextPage && !loading && (
          <button
            onClick={loadNext}
            style={{
              width: '100%', padding: '12px 0', marginTop: 16,
              background: '#2b6cb0', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}
          >
            더 보기
          </button>
        )
      )}
    </div>
  );
}
