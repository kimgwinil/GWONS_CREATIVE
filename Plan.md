# 📋 GWONS_CREATIVE — 전시 및 체험관 기획 플랫폼 상세 Plan

> **작성일**: 2026-04-14  
> **작성자**: 기획팀 (GWONS_CREATIVE)  
> **버전**: v1.0.0  
> **상태**: 사전 컨펌 대기 중 ⏳

---

## 0. 개요 (Overview)

GWONS_CREATIVE는 전시 및 체험관 기획·설계·구현을 통합 관리하는 플랫폼을 구축합니다.  
본 플랜은 **인풋 기반 페이징(Input-based Pagination / Cursor-based Pagination)** 을 핵심 기술 기준으로 채택하고,  
팀 간 협업 흐름을 **직렬(Sequential)** 및 **병렬(Parallel)** 방식으로 유연하게 구성합니다.

---

## 1. 조직 구성 (Team Structure)

```
GWONS_CREATIVE
├── 🟦 기획팀 (Planning Team)
│   └── 전체 조율 / 시나리오 / 기본·상세설계 / 실행
├── 🟧 3D 디자인팀 (3D Design Team)
│   └── 인테리어 구조물 / 창의적 3D 이미지·모델링
├── 🟩 2D 디자인팀 (2D Design Team)
│   └── 건축·구조물 도면 / 기본 구조 설계 지원
└── 🟥 조달팀 (Procurement Team)
    └── H/W, S/W, 콘텐츠 시장조사 / 커스텀 가능여부 검토
```

---

## 2. 프로젝트 단계 및 협업 흐름 (Phase & Collaboration Flow)

### 📌 전체 단계 개요

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
  착수       기획      설계      조달       구현       운영
```

---

### Phase 0: 착수 (Kick-off) — 직렬(Serial)

| 순서 | 담당 팀 | 업무 내용 | 산출물 |
|------|---------|----------|--------|
| 1 | 기획팀 | 프로젝트 목적·범위·일정 정의 | 착수 보고서 |
| 2 | 기획팀 | 팀 구성 및 역할 배분 확정 | 팀 편성표 |
| 3 | 전체 | 킥오프 회의 및 컨펌 | 컨펌 완료 기록 |

> ⚠️ **컨펌 게이트 #0**: Phase 0 산출물 확인 후 Phase 1 진입

---

### Phase 1: 기획 (Planning) — 직렬 + 병렬 혼합

```
[기획팀] 시나리오 작성
    │
    ▼
[기획팀] 전시 콘셉트 기획서 작성
    │
    ├──(병렬)──────────────────────┐
    ▼                              ▼
[3D 디자인팀]                [2D 디자인팀]
초기 공간 무드보드 수집        공간 기본 레이아웃 스케치
    │                              │
    └──────────(합류)──────────────┘
                   │
                   ▼
             [기획팀] 통합 기획서 완성
```

| 담당 팀 | 업무 내용 | 산출물 |
|---------|----------|--------|
| 기획팀 | 전시 시나리오 / 체험 시퀀스 설계 | 시나리오 문서 |
| 기획팀 | 콘셉트 기획서 (주제·동선·체험요소) | 기획서 v1 |
| 3D 디자인팀 | 무드보드 / 레퍼런스 수집 | 무드보드 PDF |
| 2D 디자인팀 | 기본 평면 레이아웃 스케치 | 스케치 도면 |
| 기획팀 | 통합 기획서 작성 | 기획서 Final |

> ⚠️ **컨펌 게이트 #1**: 통합 기획서 클라이언트 승인 후 Phase 2 진입

---

### Phase 2: 설계 (Design) — 병렬(Parallel) 주도

```
                [기획팀] 기본설계 가이드 배포
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    [3D 디자인팀]   [2D 디자인팀]   [조달팀]
    3D 모델링 착수  실시 도면 작성  시장조사 시작
    구조물 렌더링   구조 상세도면   H/W·S/W 목록 초안
          │              │              │
          └──────────────┴──────────────┘
                         │
                   [기획팀] 통합 검토
                   상세설계서 확정
```

| 담당 팀 | 업무 내용 | 산출물 |
|---------|----------|--------|
| 기획팀 | 기본설계서 / 상세설계서 작성 | 설계서 |
| 3D 디자인팀 | 공간별 3D 모델링 & 렌더링 | 렌더링 이미지 / 3D 파일 |
| 2D 디자인팀 | 건축 도면 / 전기·통신 기본도 | CAD 도면 |
| 조달팀 | 필요 품목 목록 초안 / 시장 가격 조사 | 조달 목록 초안 |

> ⚠️ **컨펌 게이트 #2**: 설계 도서 및 3D 시각화 클라이언트 승인 후 Phase 3 진입

---

### Phase 3: 조달 (Procurement) — 직렬 + 병렬

```
[기획팀 + 조달팀] 최종 조달 목록 확정
         │
         ├──(병렬)─────────────────────────────┐
         ▼                                     ▼
[조달팀] H/W 구매·납기 협의            [조달팀] S/W·콘텐츠
 디스플레이, 센서, 구조물 등             라이선스 구매 / 커스텀 개발 의뢰
         │                                     │
         └──────────(합류)─────────────────────┘
                        │
              [조달팀] 납품·검수 일정표 확정
              [기획팀] 구현 일정 조율
```

| 담당 팀 | 업무 내용 | 산출물 |
|---------|----------|--------|
| 조달팀 | H/W 사양 확정 및 발주 | 발주서 |
| 조달팀 | S/W·콘텐츠 커스텀 가능여부 최종 검토 | 검토 보고서 |
| 조달팀 | 납품 일정표 | 납품 스케줄 |
| 기획팀 | 구현 마스터 일정 조율 | 통합 일정표 |

> ⚠️ **컨펌 게이트 #3**: 조달 목록 및 예산 최종 승인 후 Phase 4 진입

---

### Phase 4: 구현 (Implementation) — 병렬(Parallel)

```
    ┌─────────────┬─────────────┬─────────────┐
    ▼             ▼             ▼             ▼
[시공팀]     [3D 디자인팀] [소프트웨어팀] [기획팀]
공간 시공     현장 시각화   콘텐츠 설치   품질 관리
구조물 설치   지원·수정    시스템 연동   일정 관리
    │             │             │             │
    └─────────────┴─────────────┴─────────────┘
                        │
                  [기획팀] 통합 테스트
                  전시 시뮬레이션 검증
```

> ⚠️ **컨펌 게이트 #4**: 통합 테스트 완료 및 최종 점검 후 Phase 5 진입

---

### Phase 5: 운영 (Operation)

| 담당 팀 | 업무 내용 |
|---------|----------|
| 기획팀 | 오픈 운영 가이드 전달 |
| 조달팀 | 유지보수 계약 지원 |
| 3D/2D 팀 | 추가 콘텐츠 업데이트 지원 |

---

## 3. 핵심 기술 설계 — 인풋 기반 페이징 (Input-based / Cursor-based Pagination)

### 3.1 왜 인풋 기반 페이징인가?

| 구분 | 오프셋 페이징 (기존) | 인풋 기반 페이징 (채택) |
|------|---------------------|----------------------|
| 방식 | `?page=2&size=10` | `?cursor=<token>&limit=10` |
| 데이터 일관성 | 중간 삽입·삭제 시 오류 | 항상 일관된 순서 보장 |
| 성능 | OFFSET이 클수록 느림 | 인덱스 기반으로 항상 빠름 |
| 실시간 데이터 | 중복/누락 발생 | 중복·누락 없음 |
| 적용 사례 | 단순 게시판 | 전시 콘텐츠, 체험 로그, 대용량 조달 목록 |

---

### 3.2 인풋 기반 페이징 데이터 모델

#### 📥 요청 (Request Input)

```typescript
// Input-based Pagination Request
interface PaginationInput {
  cursor?: string;       // 마지막으로 받은 아이템의 커서 토큰 (첫 요청 시 null)
  limit: number;         // 한 번에 가져올 항목 수 (기본값: 20, 최대: 100)
  direction?: 'next' | 'prev';  // 탐색 방향 (기본값: 'next')
  filter?: Record<string, unknown>;  // 필터 조건 (팀, 상태, 날짜 등)
  sort?: {
    field: string;       // 정렬 기준 필드
    order: 'asc' | 'desc';
  };
}
```

#### 📤 응답 (Response Output)

```typescript
// Input-based Pagination Response
interface PaginationResponse<T> {
  data: T[];             // 실제 데이터 목록
  pageInfo: {
    hasNextPage: boolean;      // 다음 페이지 존재 여부
    hasPreviousPage: boolean;  // 이전 페이지 존재 여부
    startCursor: string;       // 현재 페이지 첫 번째 아이템 커서
    endCursor: string;         // 현재 페이지 마지막 아이템 커서
    totalCount?: number;       // 전체 항목 수 (선택적)
  };
}
```

---

### 3.3 커서 토큰 생성 전략

```typescript
// 커서 토큰: Base64 인코딩된 복합 키
// 형식: base64({ id, createdAt, sortField })

function encodeCursor(item: { id: string; createdAt: Date; sortValue?: unknown }): string {
  const cursorData = {
    id: item.id,
    createdAt: item.createdAt.toISOString(),
    sortValue: item.sortValue ?? null,
  };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64url');
}

function decodeCursor(cursor: string): { id: string; createdAt: string; sortValue: unknown } {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
}
```

---

### 3.4 데이터베이스 쿼리 패턴

#### PostgreSQL / TypeORM 예시

```typescript
async function getPaginatedExhibits(input: PaginationInput): Promise<PaginationResponse<Exhibit>> {
  const { cursor, limit = 20, direction = 'next', filter, sort } = input;

  let whereClause: FindOptionsWhere<Exhibit> = { ...filter };

  // 커서가 있는 경우 커서 이후/이전 항목만 조회
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (direction === 'next') {
      whereClause = {
        ...whereClause,
        createdAt: LessThan(new Date(decoded.createdAt)),
        // 또는 id 기반: id: LessThan(decoded.id)
      };
    } else {
      whereClause = {
        ...whereClause,
        createdAt: MoreThan(new Date(decoded.createdAt)),
      };
    }
  }

  // 실제 limit+1 개를 조회하여 hasNextPage 판별
  const items = await exhibitRepository.find({
    where: whereClause,
    order: { createdAt: direction === 'next' ? 'DESC' : 'ASC' },
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop(); // 초과 아이템 제거
  if (direction === 'prev') items.reverse(); // 이전 방향 시 순서 복원

  return {
    data: items,
    pageInfo: {
      hasNextPage: direction === 'next' ? hasMore : cursor != null,
      hasPreviousPage: direction === 'prev' ? hasMore : cursor != null,
      startCursor: items.length > 0 ? encodeCursor(items[0]) : '',
      endCursor: items.length > 0 ? encodeCursor(items[items.length - 1]) : '',
    },
  };
}
```

#### GraphQL 스키마 정의

```graphql
# Input-based Pagination — GraphQL Schema

input PaginationInput {
  cursor: String
  limit: Int = 20
  direction: Direction = NEXT
  sortField: String = "createdAt"
  sortOrder: SortOrder = DESC
}

enum Direction {
  NEXT
  PREV
}

enum SortOrder {
  ASC
  DESC
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String!
  endCursor: String!
  totalCount: Int
}

type ExhibitEdge {
  node: Exhibit!
  cursor: String!
}

type ExhibitConnection {
  edges: [ExhibitEdge!]!
  pageInfo: PageInfo!
}

type Query {
  exhibits(input: PaginationInput!): ExhibitConnection!
  procurementItems(input: PaginationInput!): ProcurementConnection!
  designAssets(input: PaginationInput!): DesignAssetConnection!
  projectPhases(input: PaginationInput!): PhaseConnection!
}
```

#### REST API 엔드포인트 설계

```
# 전시 목록 조회 (Input-based)
GET /api/v1/exhibits?cursor=eyJpZCI6MTAwfQ&limit=20&direction=next

# 응답 예시
{
  "data": [...],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "eyJpZCI6MTAxfQ",
    "endCursor": "eyJpZCI6MTIwfQ",
    "totalCount": 250
  }
}

# 조달 목록 조회
GET /api/v1/procurement?cursor=&limit=50&filter[status]=pending

# 디자인 에셋 조회
GET /api/v1/design-assets?cursor=eyJpZCI6NTB9&limit=10&sort[field]=updatedAt&sort[order]=desc
```

---

### 3.5 프론트엔드 페이징 UI 컴포넌트 설계

```typescript
// React 기반 무한 스크롤 + 커서 페이징 훅
interface UseCursorPaginationOptions<T> {
  fetchFn: (input: PaginationInput) => Promise<PaginationResponse<T>>;
  limit?: number;
  initialFilter?: Record<string, unknown>;
}

function useCursorPagination<T>({
  fetchFn,
  limit = 20,
  initialFilter = {},
}: UseCursorPaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loading) return;
    setLoading(true);
    try {
      const response = await fetchFn({
        cursor,
        limit,
        direction: 'next',
        filter: initialFilter,
      });
      setItems(prev => [...prev, ...response.data]);
      setCursor(response.pageInfo.endCursor);
      setHasNextPage(response.pageInfo.hasNextPage);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasNextPage, loading, fetchFn, limit, initialFilter]);

  return { items, loadMore, hasNextPage, loading };
}
```

---

## 4. 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                    GWONS_CREATIVE Platform               │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                          │
│  ├── 기획팀 대시보드 (Project Dashboard)                 │
│  ├── 3D 뷰어 (Three.js / WebGL)                        │
│  ├── 2D 도면 뷰어 (PDF / SVG Viewer)                   │
│  └── 조달 관리 (Procurement Manager)                    │
├─────────────────────────────────────────────────────────┤
│  API Layer (Node.js + GraphQL / REST)                   │
│  ├── Input-based Pagination Engine ← ★ 핵심              │
│  ├── Auth (JWT + Role-based)                            │
│  └── File Upload / CDN                                  │
├─────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                  │
│  ├── projects, phases, scenarios                        │
│  ├── design_assets (3D/2D files)                        │
│  └── procurement_items                                  │
├─────────────────────────────────────────────────────────┤
│  Storage (S3 / MinIO)                                   │
│  ├── 3D 모델 파일 (.glb, .obj)                          │
│  ├── 2D 도면 파일 (.dwg, .pdf)                          │
│  └── 렌더링 이미지 (.png, .jpg)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 데이터베이스 스키마 (Database Schema)

```sql
-- 프로젝트 테이블
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  phase       SMALLINT NOT NULL DEFAULT 0,  -- 0~5
  status      VARCHAR(50) NOT NULL DEFAULT 'planning',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 전시 콘텐츠 테이블 (인풋 기반 페이징 적용)
CREATE TABLE exhibits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id),
  title       VARCHAR(255) NOT NULL,
  category    VARCHAR(100),
  status      VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 커서 페이징 성능을 위한 복합 인덱스
  CONSTRAINT exhibits_cursor_idx UNIQUE (created_at, id)
);
-- 인풋 기반 페이징 최적화 인덱스
CREATE INDEX idx_exhibits_cursor ON exhibits (created_at DESC, id DESC);
CREATE INDEX idx_exhibits_project ON exhibits (project_id, created_at DESC);

-- 디자인 에셋 테이블 (3D/2D)
CREATE TABLE design_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id),
  team_type   VARCHAR(20) NOT NULL,  -- '3d' | '2d'
  file_url    TEXT NOT NULL,
  asset_type  VARCHAR(50),           -- 'model' | 'render' | 'drawing'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assets_cursor ON design_assets (created_at DESC, id DESC);

-- 조달 항목 테이블
CREATE TABLE procurement_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id),
  category        VARCHAR(50) NOT NULL,  -- 'hardware' | 'software' | 'content'
  name            VARCHAR(255) NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'researching',
  is_customizable BOOLEAN DEFAULT FALSE,
  estimated_cost  DECIMAL(15,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_procurement_cursor ON procurement_items (created_at DESC, id DESC);
```

---

## 6. 팀별 API 엔드포인트 설계

### 기획팀 API
```
GET    /api/v1/projects?cursor=&limit=20          # 프로젝트 목록 (인풋 기반)
POST   /api/v1/projects                           # 프로젝트 생성
GET    /api/v1/projects/:id/phases               # 단계 조회
PUT    /api/v1/projects/:id/phases/:phase/confirm # 컨펌 게이트 처리
GET    /api/v1/scenarios?cursor=&limit=20         # 시나리오 목록 (인풋 기반)
```

### 3D 디자인팀 API
```
GET    /api/v1/design-assets?cursor=&type=3d     # 3D 에셋 목록 (인풋 기반)
POST   /api/v1/design-assets/upload              # 3D 파일 업로드
GET    /api/v1/renders?cursor=&project_id=...    # 렌더링 이미지 목록 (인풋 기반)
```

### 2D 디자인팀 API
```
GET    /api/v1/design-assets?cursor=&type=2d     # 2D 도면 목록 (인풋 기반)
POST   /api/v1/drawings/upload                   # 도면 업로드
```

### 조달팀 API
```
GET    /api/v1/procurement?cursor=&limit=50      # 조달 목록 (인풋 기반)
POST   /api/v1/procurement                       # 조달 항목 등록
PUT    /api/v1/procurement/:id/status            # 조달 상태 변경
GET    /api/v1/procurement/market-research?cursor= # 시장조사 결과 (인풋 기반)
```

---

## 7. 인풋 기반 페이징 테스트 시나리오

```typescript
// 테스트 케이스 정의

describe('Input-based Pagination', () => {
  test('첫 페이지 조회 (cursor 없음)', async () => {
    const result = await getExhibits({ limit: 10 });
    expect(result.data).toHaveLength(10);
    expect(result.pageInfo.hasPreviousPage).toBe(false);
    expect(result.pageInfo.endCursor).toBeTruthy();
  });

  test('다음 페이지 조회 (endCursor 사용)', async () => {
    const firstPage = await getExhibits({ limit: 10 });
    const secondPage = await getExhibits({
      cursor: firstPage.pageInfo.endCursor,
      limit: 10,
      direction: 'next',
    });
    // 중복 없음 검증
    const firstIds = firstPage.data.map(d => d.id);
    const secondIds = secondPage.data.map(d => d.id);
    expect(firstIds).not.toEqual(expect.arrayContaining(secondIds));
  });

  test('마지막 페이지에서 hasNextPage = false', async () => {
    // ...
  });

  test('데이터 추가 시 중복/누락 없음 검증', async () => {
    // 첫 페이지 조회 중 새 항목 추가 후 두 번째 페이지 조회
    // cursor 기반이므로 신규 항목이 끼어들지 않음
    // ...
  });
});
```

---

## 8. 마일스톤 및 일정

| 단계 | 기간 | 담당 | 컨펌 게이트 |
|------|------|------|-------------|
| Phase 0: 착수 | Week 1 | 기획팀 전체 | ✅ 게이트 #0 |
| Phase 1: 기획 | Week 2–4 | 기획·3D·2D | ✅ 게이트 #1 |
| Phase 2: 설계 | Week 5–8 | 전 팀 병렬 | ✅ 게이트 #2 |
| Phase 3: 조달 | Week 9–11 | 조달·기획 | ✅ 게이트 #3 |
| Phase 4: 구현 | Week 12–16 | 전 팀 병렬 | ✅ 게이트 #4 |
| Phase 5: 운영 | Week 17~ | 기획·조달 | — |

---

## 9. 기술 스택 확정안

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | React 18 + TypeScript + Vite | - |
| State | TanStack Query (React Query) | 커서 페이징 캐싱 지원 |
| 3D Viewer | Three.js / React Three Fiber | 3D 모델 뷰어 |
| 2D Viewer | PDF.js / SVG | 도면 뷰어 |
| Backend | Node.js + Fastify / NestJS | - |
| API | GraphQL (Apollo) + REST | 인풋 기반 페이징 |
| DB | PostgreSQL 16 | 커서 인덱스 최적화 |
| ORM | TypeORM / Prisma | - |
| Storage | AWS S3 / MinIO | 3D·2D 파일 |
| Auth | JWT + RBAC | 팀별 권한 분리 |
| Infra | Docker + Docker Compose | - |

---

## 10. 컨펌 체크리스트 (Confirm Checklist)

> 각 Phase 종료 후 아래 항목을 모두 충족해야 다음 Phase로 진입합니다.

### 게이트 #1 (기획 완료)
- [ ] 시나리오 문서 작성 완료
- [ ] 콘셉트 기획서 클라이언트 검토 완료
- [ ] 3D 무드보드 공유 완료
- [ ] 2D 기본 레이아웃 스케치 완료
- [ ] 팀장 최종 서명

### 게이트 #2 (설계 완료)
- [ ] 기본설계서 + 상세설계서 완성
- [ ] 3D 렌더링 최종본 클라이언트 승인
- [ ] CAD 도면 검토 완료
- [ ] 조달 목록 초안 확인

### 게이트 #3 (조달 완료)
- [ ] 전체 조달 항목 발주 완료
- [ ] S/W 커스텀 개발 계약 체결
- [ ] 납품 일정 확정
- [ ] 예산 최종 승인

### 게이트 #4 (구현 완료)
- [ ] 공간 시공 완료
- [ ] 시스템 통합 테스트 통과
- [ ] 전시 시뮬레이션 검증 완료
- [ ] 운영 가이드 전달 완료

---

## 11. 리스크 관리

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 조달 지연 | 높음 | 대체 공급처 사전 확보, 리드타임 여유 확보 |
| 3D 파일 용량 과부하 | 중간 | CDN + LOD(Level of Detail) 전략 적용 |
| 페이징 커서 토큰 만료 | 낮음 | 토큰 TTL 설정 + 만료 시 재시작 처리 |
| 팀 간 설계 불일치 | 중간 | 주간 동기화 미팅 + 통합 설계 리뷰 |
| 클라이언트 요구 변경 | 높음 | 컨펌 게이트에서 변경 범위 명확화 |

---

## 12. 다음 단계 (Next Action)

> **현재 상태**: 본 Plan.md에 대한 **사전 컨펌 대기 중** ⏳

1. ✅ **팀장 검토**: 본 계획서 내용 검토
2. ✅ **팀원 공유**: 각 팀에 역할 및 일정 공유
3. ⏳ **클라이언트 컨펌**: 기획·기술 방향성 승인 요청
4. ⏳ **Phase 0 착수**: 컨펌 완료 후 킥오프 미팅 진행

---

*© 2026 GWONS_CREATIVE. All Rights Reserved.*
