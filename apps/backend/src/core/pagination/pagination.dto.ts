/**
 * GWONS_CREATIVE — Pagination DTO
 * REST API 요청/응답 DTO (class-validator 기반)
 */

export class PaginationInputDto {
  cursor?: string;
  limit?: number = 20;
  direction?: 'next' | 'prev' = 'next';
  sortField?: string = 'createdAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PageInfoDto {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
  totalCount?: number;
}

export class EdgeDto<T> {
  node: T;
  cursor: string;
}

export class PaginatedResponseDto<T> {
  data: T[];
  edges: EdgeDto<T>[];
  pageInfo: PageInfoDto;
}
