-- ============================================================
-- GWONS_CREATIVE — Phase 3 조달 단계 DB 마이그레이션
-- 파일: 004_phase3_procurement.sql
-- 팀 구성:
--   기획팀+조달팀 (직렬): procurement_lists
--   조달팀 H/W 트랙 (병렬): purchase_orders
--   조달팀 S/W 트랙 (병렬): software_orders
--   합류: delivery_schedules
--   기획팀 게이트 #3: procurement_reviews
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. procurement_lists — 최종 조달 목록 확정
--    기획팀 + 조달팀 (직렬 착수, Phase 3 트리거 문서)
--    상태: drafting → in_review → approved → locked
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurement_lists (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  status              VARCHAR(50) NOT NULL DEFAULT 'drafting',
  line_items          JSONB NOT NULL DEFAULT '[]',
  budget_summary      JSONB,
  total_budget        NUMERIC(15, 2),
  contingency_rate    NUMERIC(5, 2) NOT NULL DEFAULT 10,
  version             INTEGER NOT NULL DEFAULT 1,
  design_review_id    UUID,          -- Phase 2 컨펌 게이트 #2 참조
  approval_notes      TEXT,
  approved_by         VARCHAR(255),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커서 페이지네이션 인덱스
CREATE INDEX IF NOT EXISTS idx_procurement_lists_cursor
  ON procurement_lists (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_procurement_lists_project_status
  ON procurement_lists (project_id, status, created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_procurement_lists_updated_at
  BEFORE UPDATE ON procurement_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 2. purchase_orders — H/W 구매 발주서
--    조달팀 (병렬 — H/W 트랙)
--    상태: draft → submitted → confirmed → in_transit → delivered → inspected
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_no                VARCHAR(100) NOT NULL UNIQUE,
  title                   VARCHAR(255) NOT NULL,
  vendor_name             VARCHAR(255) NOT NULL,
  vendor_contact          VARCHAR(255),
  vendor_email            VARCHAR(255),
  status                  VARCHAR(50) NOT NULL DEFAULT 'draft',
  line_items              JSONB NOT NULL DEFAULT '[]',
  total_amount            NUMERIC(15, 2),
  currency                VARCHAR(10) NOT NULL DEFAULT 'KRW',
  payment_terms           VARCHAR(50),
  required_delivery_date  DATE,
  expected_delivery_date  DATE,
  actual_delivery_date    DATE,
  delivery_address        TEXT,
  special_conditions      TEXT,
  inspection_result       JSONB,
  inspection_pass         BOOLEAN,
  procurement_list_id     UUID REFERENCES procurement_lists(id),
  ordered_by              VARCHAR(255),
  confirmed_at            TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  inspected_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_cursor
  ON purchase_orders (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_status
  ON purchase_orders (project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor
  ON purchase_orders (project_id, vendor_name, created_at DESC);

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 3. software_orders — S/W·콘텐츠 발주서
--    조달팀 (병렬 — S/W·콘텐츠 트랙)
--    상태: draft → contracted → in_development → testing → delivered → accepted
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS software_orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_no                VARCHAR(100) NOT NULL UNIQUE,
  title                   VARCHAR(255) NOT NULL,
  order_type              VARCHAR(50) NOT NULL,   -- license, custom_dev, saas, content, maintenance
  vendor_name             VARCHAR(255) NOT NULL,
  vendor_contact          VARCHAR(255),
  status                  VARCHAR(50) NOT NULL DEFAULT 'draft',
  contract_amount         NUMERIC(15, 2),
  currency                VARCHAR(10) NOT NULL DEFAULT 'KRW',
  is_custom_development   BOOLEAN NOT NULL DEFAULT FALSE,
  tech_requirements       JSONB NOT NULL DEFAULT '[]',
  milestones              JSONB NOT NULL DEFAULT '[]',
  license_count           INTEGER,
  license_months          INTEGER,
  required_delivery_date  DATE,
  expected_delivery_date  DATE,
  contract_signed_at      TIMESTAMPTZ,
  contract_file_url       TEXT,
  deliverable_file_url    TEXT,
  test_results            JSONB,
  test_passed             BOOLEAN,
  tested_at               TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  notes                   TEXT,
  procurement_list_id     UUID REFERENCES procurement_lists(id),
  ordered_by              VARCHAR(255),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_software_orders_cursor
  ON software_orders (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_software_orders_project_status
  ON software_orders (project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_software_orders_type
  ON software_orders (project_id, order_type, created_at DESC);

CREATE TRIGGER trg_software_orders_updated_at
  BEFORE UPDATE ON software_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 4. delivery_schedules — 납품 일정표
--    기획팀 + 조달팀 합류 — H/W·S/W 통합 납품 일정
--    상태: planning → confirmed → in_progress → (delayed?) → completed
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_schedules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                   VARCHAR(255) NOT NULL,
  description             TEXT,
  status                  VARCHAR(50) NOT NULL DEFAULT 'planning',
  delivery_events         JSONB NOT NULL DEFAULT '[]',
  installation_links      JSONB NOT NULL DEFAULT '[]',
  target_completion_date  DATE,
  actual_completion_date  DATE,
  total_events            INTEGER NOT NULL DEFAULT 0,
  completed_events        INTEGER NOT NULL DEFAULT 0,
  delayed_events          INTEGER NOT NULL DEFAULT 0,
  procurement_list_id     UUID REFERENCES procurement_lists(id),
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_schedules_cursor
  ON delivery_schedules (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_project_status
  ON delivery_schedules (project_id, status, created_at DESC);

CREATE TRIGGER trg_delivery_schedules_updated_at
  BEFORE UPDATE ON delivery_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 5. procurement_reviews — 조달 통합 검토서 (컨펌 게이트 #3)
--    기획팀: Phase 3 산출물 최종 통합 검토
--    통과 → Phase 4(구현) 착수
--    상태: collecting → in_review → budget_check → client_review → approved
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurement_reviews (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                       VARCHAR(255) NOT NULL,
  executive_summary           TEXT,
  status                      VARCHAR(50) NOT NULL DEFAULT 'collecting',
  deliverables                JSONB NOT NULL DEFAULT '[]',
  budget_comparisons          JSONB NOT NULL DEFAULT '[]',
  procurement_issues          JSONB NOT NULL DEFAULT '[]',
  total_procurement_amount    NUMERIC(15, 2),
  budget_variance             NUMERIC(15, 2),
  is_within_budget            BOOLEAN,
  internal_notes              TEXT,
  client_feedback             TEXT,
  version                     INTEGER NOT NULL DEFAULT 1,
  procurement_list_id         UUID REFERENCES procurement_lists(id),
  delivery_schedule_id        UUID REFERENCES delivery_schedules(id),
  approved_by                 VARCHAR(255),
  approved_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procurement_reviews_cursor
  ON procurement_reviews (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_procurement_reviews_project_status
  ON procurement_reviews (project_id, status, created_at DESC);

CREATE TRIGGER trg_procurement_reviews_updated_at
  BEFORE UPDATE ON procurement_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- Phase 3 완료 확인 코멘트
-- ──────────────────────────────────────────────────────────
COMMENT ON TABLE procurement_lists   IS 'Phase 3: 최종 조달 목록 — 기획팀+조달팀 직렬 착수';
COMMENT ON TABLE purchase_orders     IS 'Phase 3: H/W 구매 발주서 — 조달팀 병렬(H/W 트랙)';
COMMENT ON TABLE software_orders     IS 'Phase 3: S/W·콘텐츠 발주서 — 조달팀 병렬(S/W 트랙)';
COMMENT ON TABLE delivery_schedules  IS 'Phase 3: 납품 일정표 — H/W·S/W 통합 합류';
COMMENT ON TABLE procurement_reviews IS 'Phase 3: 조달 통합 검토서 — 컨펌 게이트 #3 → Phase 4 착수';
