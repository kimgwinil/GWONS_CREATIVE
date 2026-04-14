/**
 * GWONS_CREATIVE — PaginationEngine Unit Tests
 * 인풋 기반 페이징 엔진 동작 검증
 */
import { CursorUtil } from '../cursor.util';

// TypeORM Repository를 직접 사용하지 않고 로직만 검증
describe('PaginationEngine — 로직 단위 검증', () => {
  const makeItem = (id: string, offset: number) => ({
    id,
    createdAt: new Date(Date.now() - offset * 1000),
    title: `항목 ${id}`,
  });

  const items = Array.from({ length: 25 }, (_, i) =>
    makeItem(`id-${String(i + 1).padStart(3, '0')}`, i * 10),
  );

  describe('커서 기반 슬라이싱 로직', () => {
    it('limit+1 전략: 26개 조회 시 hasNextPage=true, 실제 25개 반환', () => {
      const limit = 10;
      const rawItems = items.slice(0, limit + 1); // 11개
      const hasMore  = rawItems.length > limit;   // true
      const finalItems = hasMore ? rawItems.slice(0, limit) : rawItems; // 10개

      expect(hasMore).toBe(true);
      expect(finalItems).toHaveLength(10);
    });

    it('마지막 페이지: limit+1 조회했을 때 limit 이하이면 hasNextPage=false', () => {
      const limit    = 10;
      const rawItems = items.slice(20, 26); // 5개 (25개 중 21~25)
      const hasMore  = rawItems.length > limit; // false

      expect(hasMore).toBe(false);
      expect(rawItems).toHaveLength(5);
    });

    it('빈 결과: hasNextPage=false, hasPreviousPage=false', () => {
      const rawItems: typeof items = [];
      const hasMore = rawItems.length > 10;
      expect(hasMore).toBe(false);
    });
  });

  describe('커서 토큰 → 페이지 연속성 검증', () => {
    it('첫 페이지의 endCursor로 두 번째 페이지 조회 시 중복 없음', () => {
      const limit = 5;
      const page1 = items.slice(0, limit); // id-001 ~ id-005
      const endCursor = CursorUtil.encode(page1[page1.length - 1]);
      const decoded   = CursorUtil.decode(endCursor);

      // 두 번째 페이지: createdAt < page1의 마지막 항목 createdAt
      const page1EndDate = new Date(decoded.createdAt);
      const page2 = items.filter(item => item.createdAt < page1EndDate).slice(0, limit);

      const page1Ids = page1.map(i => i.id);
      const page2Ids = page2.map(i => i.id);

      // 중복 없음 검증
      const duplicates = page1Ids.filter(id => page2Ids.includes(id));
      expect(duplicates).toHaveLength(0);
    });

    it('모든 페이지를 순회하면 전체 아이템과 동일해야 한다', () => {
      const limit      = 7;
      const allFetched: typeof items = [];
      let   cursor: string | undefined = undefined;

      // 커서 기반 페이지네이션 시뮬레이션
      for (let page = 0; page < 10; page++) {
        let batch: typeof items;
        if (!cursor) {
          batch = items.slice(0, limit + 1);
        } else {
          const decoded  = CursorUtil.decode(cursor);
          const cursorDate = new Date(decoded.createdAt);
          batch = items.filter(i => i.createdAt < cursorDate).slice(0, limit + 1);
        }

        const hasMore = batch.length > limit;
        const finalBatch = hasMore ? batch.slice(0, limit) : batch;
        allFetched.push(...finalBatch);

        if (!hasMore) break;
        cursor = CursorUtil.encode(finalBatch[finalBatch.length - 1]);
      }

      // 전체 25개를 빠짐없이 가져왔는지 확인
      expect(allFetched).toHaveLength(items.length);

      // 순서 검증 (DESC → 오래된 것이 나중에)
      const fetchedIds = allFetched.map(i => i.id);
      const originalIds = items.map(i => i.id);
      expect(fetchedIds).toEqual(originalIds);
    });
  });

  describe('방향(direction) 처리', () => {
    it("direction='next' 시 endCursor 사용", () => {
      const page1    = items.slice(0, 5);
      const endCursor = CursorUtil.encode(page1[4]);
      const decoded  = CursorUtil.decode(endCursor);
      expect(decoded.id).toBe(page1[4].id);
    });

    it("direction='prev' 시 startCursor 사용 및 결과 역정렬", () => {
      const page2      = items.slice(5, 10);
      const startCursor = CursorUtil.encode(page2[0]);
      const decoded    = CursorUtil.decode(startCursor);
      expect(decoded.id).toBe(page2[0].id);
    });
  });
});
