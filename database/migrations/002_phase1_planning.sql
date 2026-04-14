-- ============================================================
-- GWONS_CREATIVE — Phase 1 Planning Schema
-- Migration: 002_phase1_planning.sql
-- Description: 기획 단계 테이블 생성
--   - scenarios        (기획팀: 시나리오)
--   - concept_plans    (기획팀: 콘셉트 기획서)
--   - moodboards       (3D팀: 무드보드)  ─── 병렬
--   - layout_sketches  (2D팀: 레이아웃 스케치) ─ 병렬
--   - integrated_plans (기획팀: 통합 기획서 합류)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. 시나리오 테이블 (기획팀)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenarios (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  type                  VARCHAR(50) NOT NULL DEFAULT 'main',
  status                VARCHAR(50) NOT NULL DEFAULT 'draft',
  steps                 JSONB       NOT NULL DEFAULT '[]',
  total_duration_minutes INT,
  target_audience       VARCHAR(100),
  max_capacity          INT,
  review_notes          TEXT,
  approved_by           VARCHAR(100),
  approved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scenarios_cursor  ON scenarios (created_at DESC, id DESC);
CREATE INDEX idx_scenarios_project ON scenarios (project_id, status, created_at DESC);
CREATE TRIGGER trg_scenarios_updated_at BEFORE UPDATE ON scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 2. 콘셉트 기획서 테이블 (기획팀)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concept_plans (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                    VARCHAR(255) NOT NULL,
  theme                    VARCHAR(50) NOT NULL DEFAULT 'custom',
  concept_statement        TEXT,
  objectives               TEXT,
  target_audience          VARCHAR(100),
  exhibition_days          INT,
  expected_daily_visitors  INT,
  circulation_zones        JSONB       NOT NULL DEFAULT '[]',
  experience_elements      JSONB       NOT NULL DEFAULT '[]',
  total_area_sqm           DECIMAL(10,2),
  status                   VARCHAR(50) NOT NULL DEFAULT 'draft',
  version                  INT         NOT NULL DEFAULT 1,
  review_notes             TEXT,
  approved_by              VARCHAR(100),
  approved_at              TIMESTAMPTZ,
  linked_scenario_ids      JSONB       NOT NULL DEFAULT '[]',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_concept_plans_cursor  ON concept_plans (created_at DESC, id DESC);
CREATE INDEX idx_concept_plans_project ON concept_plans (project_id, status, created_at DESC);
CREATE TRIGGER trg_concept_plans_updated_at BEFORE UPDATE ON concept_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 3. 무드보드 테이블 (3D 디자인팀) — 병렬
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moodboards (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title              VARCHAR(255) NOT NULL,
  description        TEXT,
  mood               VARCHAR(50) NOT NULL DEFAULT 'futuristic',
  references         JSONB       NOT NULL DEFAULT '[]',
  color_palette      JSONB       NOT NULL DEFAULT '[]',
  material_keywords  JSONB       NOT NULL DEFAULT '[]',
  lighting_concept   TEXT,
  created_by         VARCHAR(100),
  status             VARCHAR(50) NOT NULL DEFAULT 'draft',
  concept_plan_id    UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_moodboards_cursor  ON moodboards (created_at DESC, id DESC);
CREATE INDEX idx_moodboards_project ON moodboards (project_id, status, created_at DESC);
CREATE TRIGGER trg_moodboards_updated_at BEFORE UPDATE ON moodboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 4. 레이아웃 스케치 테이블 (2D 디자인팀) — 병렬
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS layout_sketches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  sketch_type      VARCHAR(50) NOT NULL DEFAULT 'floor_plan',
  status           VARCHAR(50) NOT NULL DEFAULT 'draft',
  file_url         TEXT,
  thumbnail_url    TEXT,
  file_format      VARCHAR(20),
  zones            JSONB       NOT NULL DEFAULT '[]',
  dimensions       JSONB,
  floor_number     INT         NOT NULL DEFAULT 1,
  version          INT         NOT NULL DEFAULT 1,
  revision_notes   TEXT,
  created_by       VARCHAR(100),
  concept_plan_id  UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_layout_sketches_cursor  ON layout_sketches (created_at DESC, id DESC);
CREATE INDEX idx_layout_sketches_project ON layout_sketches (project_id, sketch_type, created_at DESC);
CREATE TRIGGER trg_layout_sketches_updated_at BEFORE UPDATE ON layout_sketches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 5. 통합 기획서 테이블 (기획팀 합류 결과) — 컨펌 게이트 #1
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrated_plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  executive_summary TEXT,
  status            VARCHAR(50) NOT NULL DEFAULT 'assembling',
  deliverables      JSONB       NOT NULL DEFAULT '[]',
  concept_plan_id   UUID,
  scenario_id       UUID,
  moodboard_id      UUID,
  layout_sketch_id  UUID,
  version           INT         NOT NULL DEFAULT 1,
  client_feedback   TEXT,
  internal_notes    TEXT,
  approved_by       VARCHAR(100),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_integrated_plans_cursor  ON integrated_plans (created_at DESC, id DESC);
CREATE INDEX idx_integrated_plans_project ON integrated_plans (project_id, status, created_at DESC);
CREATE TRIGGER trg_integrated_plans_updated_at BEFORE UPDATE ON integrated_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
