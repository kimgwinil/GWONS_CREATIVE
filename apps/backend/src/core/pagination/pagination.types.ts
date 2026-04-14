/**
 * GWONS_CREATIVE — Input-based Pagination Types
 * 오프셋 페이징 대신 커서(인풋) 기반 페이징을 사용합니다.
 */

export type SortOrder = 'ASC' | 'DESC';
export type PaginationDirection = 'next' | 'prev';

/** 페이징 요청 인풋 */
export interface PaginationInput {
  /** 마지막으로 받은 아이템의 커서 토큰 (첫 요청 시 undefined) */
  cursor?: string;
  /** 한 번에 가져올 항목 수 (기본값: 20, 최대: 100) */
  limit?: number;
  /** 탐색 방향 (기본값: 'next') */
  direction?: PaginationDirection;
  /** 정렬 기준 필드 (기본값: 'createdAt') */
  sortField?: string;
  /** 정렬 방향 (기본값: 'DESC') */
  sortOrder?: SortOrder;
}

/** 페이지 메타 정보 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
  totalCount?: number;
}

/** 단일 엣지 (아이템 + 커서) */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/** 페이지 응답 (GraphQL Connection 스펙 준수) */
export interface PaginatedResponse<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  /** 편의를 위한 data shortcut */
  data: T[];
}

/** 커서 디코딩 결과 */
export interface DecodedCursor {
  id: string;
  createdAt: string;
  sortValue?: unknown;
}
