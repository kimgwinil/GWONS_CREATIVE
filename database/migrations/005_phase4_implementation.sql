-- =====================================================================
-- GWONS_CREATIVE — Phase 4 Implementation Migration
-- Phase 4: 시공·3D시각화·콘텐츠설치·품질검사·통합테스트 (컨펌 게이트 #4)
-- 병렬: construction_plans | site_visualizations | content_installations
-- 병렬: quality_inspections
-- 합류: integration_tests → Gate #4 → Phase 5 착수
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- [P4-1] construction_plans (시공팀 — 공간 시공 + 구조물 설치 계획)
-- Status: planning → approved → in_progress → (suspended?) → completed → inspected
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS construction_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  status               VARCHAR(50)  NOT NULL DEFAULT 'planning'
                       CHECK (status IN ('planning','approved','in_progress','suspended','completed','inspected')),

  -- 시공 작업 목록 (JSON Array of ConstructionTask)
  tasks                JSONB        NOT NULL DEFAULT '[]',
  -- 구조물 설치 목록 (JSON Array of StructureItem)
  structure_items      JSONB        NOT NULL DEFAULT '[]',
  -- 안전 점검 기록 (JSON Array of SafetyCheckRecord)
  safety_checks        JSONB        NOT NULL DEFAULT '[]',

  -- 집계
  overall_progress_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_tasks          INT          NOT NULL DEFAULT 0,
  completed_tasks      INT          NOT NULL DEFAULT 0,
  delayed_tasks        INT          NOT NULL DEFAULT 0,

  -- 일정
  planned_start_date   DATE,
  planned_end_date     DATE,
  actual_end_date      DATE,

  -- 담당자
  site_manager         VARCHAR(255),
  inspected_by         VARCHAR(255),
  inspected_at         TIMESTAMPTZ,

  -- 연계
  procurement_list_id  UUID,
  project_id           UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notes                TEXT,

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_construction_plans_cursor
  ON construction_plans (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_construction_plans_project_status
  ON construction_plans (project_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- [P4-2] site_visualizations (3D 디자인팀 — 현장 시각화 지원·수정)
-- Status: draft → in_review ⇄ revision → approved → final
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_visualizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  viz_type             VARCHAR(50)  NOT NULL
                       CHECK (viz_type IN ('as_built','progress_viz','comparison','walkthrough','vr_tour')),
  status               VARCHAR(50)  NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','in_review','revision','approved','final')),

  -- 파일 URL
  source_file_url      TEXT,
  output_file_url      TEXT,
  thumbnail_url        TEXT,

  -- 수정 이력 (JSON Array)
  revision_history     JSONB        NOT NULL DEFAULT '[]',
  -- 설계 vs 시공 비교 데이터 (JSON Array)
  comparison_data      JSONB        NOT NULL DEFAULT '[]',
  current_revision     INT          NOT NULL DEFAULT 0,

  -- 위치/연계
  target_zone          VARCHAR(255),
  construction_plan_id UUID,
  render_asset_id      UUID,

  -- 작성/승인
  created_by           VARCHAR(255),
  approved_by          VARCHAR(255),
  approved_at          TIMESTAMPTZ,
  review_notes         TEXT,

  project_id           UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visualizations_cursor
  ON site_visualizations (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_site_visualizations_project_status
  ON site_visualizations (project_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- [P4-3] content_installations (소프트웨어팀 — 콘텐츠 설치 + 시스템 연동)
-- Status: pending → in_progress → integration → testing → completed
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_installations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  status               VARCHAR(50)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','in_progress','integration','testing','completed')),

  -- 설치 항목 목록 (JSON Array of InstallationItem)
  installation_items   JSONB        NOT NULL DEFAULT '[]',
  -- 통합 테스트 기록 (JSON Array of IntegrationTestRecord)
  integration_tests    JSONB        NOT NULL DEFAULT '[]',
  -- 기술 이슈 목록 (JSON Array of TechIssue)
  tech_issues          JSONB        NOT NULL DEFAULT '[]',

  -- 집계
  total_items          INT          NOT NULL DEFAULT 0,
  installed_items      INT          NOT NULL DEFAULT 0,
  failed_items         INT          NOT NULL DEFAULT 0,

  -- 일정
  planned_start_date   DATE,
  planned_end_date     DATE,
  actual_end_date      DATE,

  -- 담당자 / 연계
  installation_lead    VARCHAR(255),
  software_order_id    UUID,
  construction_plan_id UUID,
  notes                TEXT,

  project_id           UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_installations_cursor
  ON content_installations (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_content_installations_project_status
  ON content_installations (project_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- [P4-4] quality_inspections (기획팀 — 품질 관리 + 현장 일정 관리)
-- Status: scheduled → in_progress → completed(pass) or failed → re_inspected
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_inspections (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    VARCHAR(255) NOT NULL,
  description              TEXT,
  status                   VARCHAR(50)  NOT NULL DEFAULT 'scheduled'
                           CHECK (status IN ('scheduled','in_progress','completed','failed','re_inspected')),
  category                 VARCHAR(50)  NOT NULL
                           CHECK (category IN ('construction','content','system','safety','design','experience')),

  -- 체크리스트 (JSON Array of ChecklistItem)
  checklist_items          JSONB        NOT NULL DEFAULT '[]',
  -- 결함 목록 (JSON Array of DefectRecord)
  defects                  JSONB        NOT NULL DEFAULT '[]',

  -- 집계
  total_items              INT          NOT NULL DEFAULT 0,
  passed_items             INT          NOT NULL DEFAULT 0,
  failed_items             INT          NOT NULL DEFAULT 0,

  -- 일정
  scheduled_at             TIMESTAMPTZ,
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,

  -- 점검 정보
  inspector                VARCHAR(255),
  target_zone              VARCHAR(255),
  final_result             VARCHAR(50),   -- pass | fail | conditional_pass
  overall_comment          TEXT,

  -- 연계
  construction_plan_id     UUID,
  content_installation_id  UUID,
  inspection_round         INT          NOT NULL DEFAULT 1,

  project_id               UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_cursor
  ON quality_inspections (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_project_status
  ON quality_inspections (project_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_project_category
  ON quality_inspections (project_id, category, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- [P4-5] integration_tests (기획팀 — 전시 통합 테스트 + 컨펌 게이트 #4)
-- Status: preparing → in_simulation → in_review → client_review → approved
-- APPROVED → Phase 5 착수
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_tests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    VARCHAR(255) NOT NULL,
  executive_summary        TEXT,
  status                   VARCHAR(50)  NOT NULL DEFAULT 'preparing'
                           CHECK (status IN ('preparing','in_simulation','in_review','client_review','approved','rejected')),

  -- Phase 4 산출물 체크리스트 (JSON Array of Phase4Deliverable)
  deliverables             JSONB        NOT NULL DEFAULT '[]',
  -- 시뮬레이션 시나리오 목록 (JSON Array of SimulationScenario)
  simulations              JSONB        NOT NULL DEFAULT '[]',
  -- 최종 체크리스트 (JSON Array of FinalCheckItem)
  final_checklist          JSONB        NOT NULL DEFAULT '[]',
  -- 운영 이슈 (JSON Array of OperationIssue)
  operation_issues         JSONB        NOT NULL DEFAULT '[]',

  -- 결과
  simulation_result        VARCHAR(50),   -- pass | fail | partial
  is_fully_passed          BOOLEAN,

  -- 클라이언트 피드백
  client_feedback          TEXT,
  internal_notes           TEXT,
  version                  INT          NOT NULL DEFAULT 1,

  -- 연계
  construction_plan_id     UUID,
  content_installation_id  UUID,

  -- 승인 (컨펌 게이트 #4)
  approved_by              VARCHAR(255),
  approved_at              TIMESTAMPTZ,

  project_id               UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_tests_cursor
  ON integration_tests (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_integration_tests_project_status
  ON integration_tests (project_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- auto-update triggers (updated_at)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'construction_plans', 'site_visualizations',
    'content_installations', 'quality_inspections', 'integration_tests'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Comments (데이터 모델 설명)
-- ─────────────────────────────────────────────────────────────────────
COMMENT ON TABLE construction_plans IS
  'Phase 4 시공팀: 공간 시공 + 구조물 설치 계획. planning→approved→in_progress→completed→inspected';

COMMENT ON TABLE site_visualizations IS
  'Phase 4 3D팀: 현장 시각화 지원·수정. draft→in_review→revision→approved→final';

COMMENT ON TABLE content_installations IS
  'Phase 4 소프트웨어팀: 콘텐츠 설치 + 시스템 연동. pending→in_progress→integration→testing→completed';

COMMENT ON TABLE quality_inspections IS
  'Phase 4 기획팀: 품질 관리 + 현장 일정 관리. scheduled→in_progress→completed(pass)/failed→re_inspected';

COMMENT ON TABLE integration_tests IS
  'Phase 4 합류: 전시 통합 테스트 + 컨펌 게이트 #4. approved 시 Phase 5(운영) 착수.';
