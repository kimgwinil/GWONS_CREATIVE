-- ============================================================
-- GWONS_CREATIVE — Phase 2 Design Schema
-- Migration: 003_phase2_design.sql
-- 기획팀(직렬): basic_designs, detail_designs
-- 3D팀(병렬):   render_assets
-- 2D팀(병렬):   cad_drawings
-- 조달팀(병렬): market_researches
-- 합류:         design_reviews (컨펌 게이트 #2)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. 기본설계서 (기획팀)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS basic_designs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  status               VARCHAR(50) NOT NULL DEFAULT 'draft',
  design_criteria      JSONB       NOT NULL DEFAULT '[]',
  space_programs       JSONB       NOT NULL DEFAULT '[]',
  system_requirements  JSONB       NOT NULL DEFAULT '[]',
  total_floor_area_sqm DECIMAL(10,2),
  total_floors         INT         NOT NULL DEFAULT 1,
  version              INT         NOT NULL DEFAULT 1,
  distributed_at       TIMESTAMPTZ,
  integrated_plan_id   UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_basic_designs_cursor  ON basic_designs (created_at DESC, id DESC);
CREATE INDEX idx_basic_designs_project ON basic_designs (project_id, status, created_at DESC);
CREATE TRIGGER trg_basic_designs_updated_at BEFORE UPDATE ON basic_designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 2. 상세설계서 (기획팀)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detail_designs (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                 UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                      VARCHAR(255) NOT NULL,
  description                TEXT,
  status                     VARCHAR(50) NOT NULL DEFAULT 'draft',
  finish_specs               JSONB       NOT NULL DEFAULT '[]',
  equipment_specs            JSONB       NOT NULL DEFAULT '[]',
  content_specs              JSONB       NOT NULL DEFAULT '[]',
  total_power_kw             DECIMAL(8,2),
  estimated_construction_cost DECIMAL(15,0),
  version                    INT         NOT NULL DEFAULT 1,
  approved_by                VARCHAR(100),
  approved_at                TIMESTAMPTZ,
  basic_design_id            UUID,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_detail_designs_cursor  ON detail_designs (created_at DESC, id DESC);
CREATE INDEX idx_detail_designs_project ON detail_designs (project_id, status, created_at DESC);
CREATE TRIGGER trg_detail_designs_updated_at BEFORE UPDATE ON detail_designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 3. 렌더 에셋 (3D 디자인팀) — 병렬
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_assets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  asset_type       VARCHAR(50) NOT NULL,
  view_type        VARCHAR(50),
  status           VARCHAR(50) NOT NULL DEFAULT 'modeling',
  source_file_url  TEXT,
  output_file_url  TEXT,
  thumbnail_url    TEXT,
  file_format      VARCHAR(20),
  file_size_bytes  BIGINT,
  lod_level        VARCHAR(10),
  render_settings  JSONB,
  target_zone_id   VARCHAR(100),
  version          INT         NOT NULL DEFAULT 1,
  created_by       VARCHAR(100),
  review_notes     TEXT,
  basic_design_id  UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_render_assets_cursor  ON render_assets (created_at DESC, id DESC);
CREATE INDEX idx_render_assets_project ON render_assets (project_id, asset_type, created_at DESC);
CREATE TRIGGER trg_render_assets_updated_at BEFORE UPDATE ON render_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 4. CAD 도면 (2D 디자인팀) — 병렬
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cad_drawings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  drawing_no        VARCHAR(50) NOT NULL,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  discipline        VARCHAR(50) NOT NULL,
  drawing_type      VARCHAR(50) NOT NULL,
  status            VARCHAR(50) NOT NULL DEFAULT 'draft',
  scale             VARCHAR(20),
  paper_size        VARCHAR(10),
  floor_number      INT         NOT NULL DEFAULT 1,
  file_url          TEXT,
  pdf_url           TEXT,
  thumbnail_url     TEXT,
  current_revision  VARCHAR(10) NOT NULL DEFAULT 'A',
  revision_history  JSONB       NOT NULL DEFAULT '[]',
  layers            JSONB       NOT NULL DEFAULT '[]',
  drawn_by          VARCHAR(100),
  checked_by        VARCHAR(100),
  approved_by       VARCHAR(100),
  approved_at       TIMESTAMPTZ,
  issued_at         TIMESTAMPTZ,
  basic_design_id   UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cad_drawings_cursor     ON cad_drawings (created_at DESC, id DESC);
CREATE INDEX idx_cad_drawings_discipline ON cad_drawings (project_id, discipline, created_at DESC);
CREATE INDEX idx_cad_drawings_status     ON cad_drawings (project_id, status, created_at DESC);
CREATE TRIGGER trg_cad_drawings_updated_at BEFORE UPDATE ON cad_drawings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 5. 시장조사 (조달팀) — 병렬
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_researches (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_name             VARCHAR(255) NOT NULL,
  description           TEXT,
  category              VARCHAR(50) NOT NULL,
  status                VARCHAR(50) NOT NULL DEFAULT 'open',
  quantity              INT         NOT NULL DEFAULT 1,
  unit                  VARCHAR(50),
  vendor_quotes         JSONB       NOT NULL DEFAULT '[]',
  tech_specs            JSONB       NOT NULL DEFAULT '[]',
  recommended_vendor    VARCHAR(255),
  recommendation_reason TEXT,
  is_customizable       BOOLEAN     NOT NULL DEFAULT FALSE,
  customization_spec    TEXT,
  estimated_min_price   DECIMAL(15,2),
  estimated_max_price   DECIMAL(15,2),
  researched_by         VARCHAR(100),
  procurement_item_id   UUID,
  content_spec_ref      VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_market_researches_cursor   ON market_researches (created_at DESC, id DESC);
CREATE INDEX idx_market_researches_category ON market_researches (project_id, category, created_at DESC);
CREATE INDEX idx_market_researches_status   ON market_researches (project_id, status, created_at DESC);
CREATE TRIGGER trg_market_researches_updated_at BEFORE UPDATE ON market_researches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────
-- 6. 설계 통합 검토 (기획팀 합류 — 컨펌 게이트 #2)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS design_reviews (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               VARCHAR(255) NOT NULL,
  executive_summary   TEXT,
  status              VARCHAR(50) NOT NULL DEFAULT 'collecting',
  deliverables        JSONB       NOT NULL DEFAULT '[]',
  design_issues       JSONB       NOT NULL DEFAULT '[]',
  basic_design_id     UUID,
  detail_design_id    UUID,
  render_asset_id     UUID,
  cad_drawing_id      UUID,
  market_research_id  UUID,
  version             INT         NOT NULL DEFAULT 1,
  client_feedback     TEXT,
  internal_notes      TEXT,
  approved_by         VARCHAR(100),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_design_reviews_cursor  ON design_reviews (created_at DESC, id DESC);
CREATE INDEX idx_design_reviews_project ON design_reviews (project_id, status, created_at DESC);
CREATE TRIGGER trg_design_reviews_updated_at BEFORE UPDATE ON design_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
