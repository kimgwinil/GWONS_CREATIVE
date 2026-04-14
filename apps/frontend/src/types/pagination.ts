/**
 * GWONS_CREATIVE — Frontend Pagination Types
 * 백엔드 PaginationEngine과 동기화된 타입 정의
 */

export type SortOrder = 'ASC' | 'DESC';
export type PaginationDirection = 'next' | 'prev';

export interface PaginationInput {
  cursor?: string;
  limit?: number;
  direction?: PaginationDirection;
  sortField?: string;
  sortOrder?: SortOrder;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
  totalCount?: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  edges: Edge<T>[];
  pageInfo: PageInfo;
}
