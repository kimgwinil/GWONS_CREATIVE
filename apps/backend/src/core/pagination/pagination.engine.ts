/**
 * GWONS_CREATIVE — Input-based Pagination Engine
 * 핵심 페이징 엔진: TypeORM Repository 기반
 * 오프셋 없이 커서(ID + createdAt)로 페이지를 결정합니다.
 */

import { Repository, FindOptionsWhere, LessThan, MoreThan, ObjectLiteral } from 'typeorm';
import { CursorUtil } from './cursor.util';
import { PaginationInput, PaginatedResponse, Edge } from './pagination.types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class PaginationEngine {
  /**
   * 인풋 기반 페이징 실행
   * @param repository - TypeORM Repository
   * @param input - 페이징 입력값 (cursor, limit, direction, ...)
   * @param baseWhere - 기본 WHERE 조건 (필터)
   * @param relations - 조인할 관계
   */
  static async paginate<T extends ObjectLiteral & { id: string; createdAt: Date }>(
    repository: Repository<T>,
    input: PaginationInput,
    baseWhere: FindOptionsWhere<T> = {},
    relations: string[] = [],
  ): Promise<PaginatedResponse<T>> {
    const {
      cursor,
      limit: rawLimit = DEFAULT_LIMIT,
      direction = 'next',
      sortField = 'createdAt',
      sortOrder = 'DESC',
    } = input;

    // limit 범위 제한
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

    // WHERE 조건 구성 (커서 기반)
    let whereClause: FindOptionsWhere<T> = { ...baseWhere };

    if (cursor) {
      if (!CursorUtil.isValid(cursor)) {
        throw new Error('유효하지 않은 커서 토큰입니다.');
      }
      const decoded = CursorUtil.decode(cursor);
      const cursorDate = new Date(decoded.createdAt);

      /**
       * 방향에 따라 커서 이후/이전 항목 조회
       * next + DESC: createdAt < cursorDate  (최신순에서 더 오래된 것으로)
       * prev + DESC: createdAt > cursorDate  (더 최신 것으로 역행)
       */
      if (direction === 'next') {
        whereClause = {
          ...whereClause,
          createdAt: (sortOrder === 'DESC' ? LessThan(cursorDate) : MoreThan(cursorDate)) as any,
        };
      } else {
        whereClause = {
          ...whereClause,
          createdAt: (sortOrder === 'DESC' ? MoreThan(cursorDate) : LessThan(cursorDate)) as any,
        };
      }
    }

    // limit + 1 조회 → hasMore 판별
    const effectiveSortOrder =
      direction === 'prev'
        ? sortOrder === 'DESC' ? 'ASC' : 'DESC'
        : sortOrder;

    const rawItems = await repository.find({
      where: whereClause,
      order: { [sortField]: effectiveSortOrder } as any,
      take: limit + 1,
      relations,
    });

    const hasMore = rawItems.length > limit;
    if (hasMore) rawItems.pop(); // 초과 아이템 제거

    // 이전 방향 탐색 시 순서 복원
    if (direction === 'prev') rawItems.reverse();

    // Edge 구성
    const edges: Edge<T>[] = rawItems.map((item) => ({
      node: item,
      cursor: CursorUtil.encode(item, sortField),
    }));

    // totalCount (선택적 - 성능 이슈가 있으므로 별도 호출 권장)
    // const totalCount = await repository.count({ where: baseWhere });

    return {
      edges,
      data: rawItems,
      pageInfo: {
        hasNextPage: direction === 'next' ? hasMore : cursor != null,
        hasPreviousPage: direction === 'prev' ? hasMore : cursor != null,
        startCursor: edges.length > 0 ? edges[0].cursor : '',
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : '',
      },
    };
  }

  /**
   * totalCount를 포함한 페이징 (성능 주의: 별도 COUNT 쿼리 발생)
   */
  static async paginateWithCount<T extends ObjectLiteral & { id: string; createdAt: Date }>(
    repository: Repository<T>,
    input: PaginationInput,
    baseWhere: FindOptionsWhere<T> = {},
    relations: string[] = [],
  ): Promise<PaginatedResponse<T>> {
    const [result, totalCount] = await Promise.all([
      PaginationEngine.paginate(repository, input, baseWhere, relations),
      repository.count({ where: baseWhere }),
    ]);
    result.pageInfo.totalCount = totalCount;
    return result;
  }
}
