-- ============================================================
-- GWONS_CREATIVE — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: 전시·체험관 플랫폼 초기 스키마 생성
--              인풋 기반 페이징을 위한 커서 인덱스 포함
-- ============================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- 1. 프로젝트 테이블
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  phase           SMALLINT    NOT NULL DEFAULT 0,
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  confirm_gates   JSONB       NOT NULL DEFAULT '{}',
  client_name     VARCHAR(255),
  start_date      DATE,
  end_date        DATE,
  budget          DECIMAL(15,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인풋 기반 페이징 최적화 복합 인덱스
CREATE INDEX idx_projects_cursor    ON projects (created_at DESC, id DESC);
CREATE INDEX idx_projects_status    ON projects (status, created_at DESC);
CREATE INDEX idx_projects_phase     ON projects (phase, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- 2. 전시 콘텐츠 테이블
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exhibits (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  category             VARCHAR(50),
  status               VARCHAR(50) NOT NULL DEFAULT 'draft',
  scenario             JSONB,
  sequence             INT         NOT NULL DEFAULT 0,
  duration_minutes     INT,
  capacity_per_session INT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커서 페이징 최적화 인덱스
CREATE INDEX idx_exhibits_cursor     ON exhibits (created_at DESC, id DESC);
CREATE INDEX idx_exhibits_project    ON exhibits (project_id, created_at DESC);
CREATE INDEX idx_exhibits_status     ON exhibits (project_id, status, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- 3. 디자인 에셋 테이블 (3D / 2D)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS design_assets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  team_type     VARCHAR(10) NOT NULL,       -- '3d' | '2d'
  asset_type    VARCHAR(50) NOT NULL,       -- 'model' | 'render' | 'drawing' | ...
  status        VARCHAR(50) NOT NULL DEFAULT 'draft',
  file_url      TEXT        NOT NULL,
  thumbnail_url TEXT,
  file_format   VARCHAR(20),
  file_size     BIGINT,
  description   TEXT,
  version       INT         NOT NULL DEFAULT 1,
  uploaded_by   VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커서 페이징 최적화 인덱스
CREATE INDEX idx_assets_cursor      ON design_assets (created_at DESC, id DESC);
CREATE INDEX idx_assets_project     ON design_assets (project_id, team_type, created_at DESC);
CREATE INDEX idx_assets_type        ON design_assets (project_id, asset_type, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- 4. 조달 항목 테이블
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurement_items (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                   VARCHAR(255) NOT NULL,
  description            TEXT,
  category               VARCHAR(50) NOT NULL,  -- 'hardware' | 'software' | ...
  status                 VARCHAR(50) NOT NULL DEFAULT 'researching',
  is_customizable        BOOLEAN     NOT NULL DEFAULT FALSE,
  custom_spec            TEXT,
  quantity               INT         NOT NULL DEFAULT 1,
  unit                   VARCHAR(50),
  estimated_cost         DECIMAL(15,2),
  actual_cost            DECIMAL(15,2),
  vendor                 VARCHAR(255),
  expected_delivery_date DATE,
  actual_delivery_date   DATE,
  market_research        JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 커서 페이징 최적화 인덱스
CREATE INDEX idx_procurement_cursor   ON procurement_items (created_at DESC, id DESC);
CREATE INDEX idx_procurement_project  ON procurement_items (project_id, category, created_at DESC);
CREATE INDEX idx_procurement_status   ON procurement_items (project_id, status, created_at DESC);

-- ──────────────────────────────────────────────────────────
-- 5. updated_at 자동 갱신 트리거
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exhibits_updated_at
  BEFORE UPDATE ON exhibits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON design_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_procurement_updated_at
  BEFORE UPDATE ON procurement_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
