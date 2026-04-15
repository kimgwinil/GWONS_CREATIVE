/**
 * GWONS_CREATIVE — App Root Module
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
// Phase 0
import { ProjectsModule } from './modules/projects/projects.module';
import { ExhibitsModule } from './modules/exhibits/exhibits.module';
import { DesignAssetsModule } from './modules/design-assets/design-assets.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
// Phase 1 — 기획팀 (직렬)
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { ConceptPlansModule } from './modules/concept-plans/concept-plans.module';
// Phase 1 — 3D/2D팀 (병렬)
import { MoodboardsModule } from './modules/moodboards/moodboards.module';
import { LayoutSketchesModule } from './modules/layout-sketches/layout-sketches.module';
// Phase 1 — 통합 기획서 (합류)
import { IntegratedPlansModule } from './modules/integrated-plans/integrated-plans.module';
// Phase 2 — 기획팀 (직렬)
import { BasicDesignsModule } from './modules/basic-designs/basic-designs.module';
import { DetailDesignsModule } from './modules/detail-designs/detail-designs.module';
// Phase 2 — 3D/2D/조달팀 (병렬)
import { RenderAssetsModule } from './modules/render-assets/render-assets.module';
import { CadDrawingsModule } from './modules/cad-drawings/cad-drawings.module';
import { MarketResearchesModule } from './modules/market-researches/market-researches.module';
// Phase 2 — 통합 검토 + 컨펌 게이트 #2
import { DesignReviewsModule } from './modules/design-reviews/design-reviews.module';
// Phase 3 — 기획팀 + 조달팀 (직렬 착수)
import { ProcurementListsModule } from './modules/procurement-lists/procurement-lists.module';
// Phase 3 — 조달팀 (병렬)
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { SoftwareOrdersModule } from './modules/software-orders/software-orders.module';
// Phase 3 — 납품 일정표 (합류)
import { DeliverySchedulesModule } from './modules/delivery-schedules/delivery-schedules.module';
// Phase 3 — 통합 검토 + 컨펌 게이트 #3
import { ProcurementReviewsModule } from './modules/procurement-reviews/procurement-reviews.module';
// Phase 4 — 시공팀 (병렬)
import { ConstructionPlansModule } from './modules/construction-plans/construction-plans.module';
// Phase 4 — 3D 디자인팀 (병렬)
import { SiteVisualizationsModule } from './modules/site-visualizations/site-visualizations.module';
// Phase 4 — 소프트웨어팀 (병렬)
import { ContentInstallationsModule } from './modules/content-installations/content-installations.module';
// Phase 4 — 기획팀 품질 관리 (병렬)
import { QualityInspectionsModule } from './modules/quality-inspections/quality-inspections.module';
// Phase 4 — 통합 테스트 + 컨펌 게이트 #4 (합류)
import { IntegrationTestsModule } from './modules/integration-tests/integration-tests.module';
// Phase 5 — 기획팀 (운영 가이드)
import { OperationGuidesModule } from './modules/operation-guides/operation-guides.module';
// Phase 5 — 조달팀 (유지보수 계약)
import { MaintenanceContractsModule } from './modules/maintenance-contracts/maintenance-contracts.module';
// Phase 5 — 3D/2D팀 (콘텐츠 업데이트)
import { ContentUpdatesModule } from './modules/content-updates/content-updates.module';
// Phase 5 — 종합 운영 리포트 (합류)
import { OperationReportsModule } from './modules/operation-reports/operation-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // ── Phase 0 ───────────────────────────
    ProjectsModule,
    ExhibitsModule,
    DesignAssetsModule,
    ProcurementModule,
    // ── Phase 1: 기획팀 (직렬) ────────────
    ScenariosModule,
    ConceptPlansModule,
    // ── Phase 1: 3D/2D팀 (병렬) ──────────
    MoodboardsModule,
    LayoutSketchesModule,
    // ── Phase 1: 통합 (합류) ──────────────
    IntegratedPlansModule,
    // ── Phase 2: 기획팀 (직렬) ────────────
    BasicDesignsModule,
    DetailDesignsModule,
    // ── Phase 2: 3D/2D/조달팀 (병렬) ─────
    RenderAssetsModule,
    CadDrawingsModule,
    MarketResearchesModule,
    // ── Phase 2: 통합 검토 (합류) ─────────
    DesignReviewsModule,
    // ── Phase 3: 기획팀+조달팀 (직렬 착수) ─
    ProcurementListsModule,
    // ── Phase 3: 조달팀 (병렬) ────────────
    PurchaseOrdersModule,
    SoftwareOrdersModule,
    // ── Phase 3: 납품 일정표 (합류) ────────
    DeliverySchedulesModule,
    // ── Phase 3: 통합 검토 (컨펌 게이트 #3) ─
    ProcurementReviewsModule,
    // ── Phase 4: 시공·3D·SW팀 (병렬) ─────────
    ConstructionPlansModule,
    SiteVisualizationsModule,
    ContentInstallationsModule,
    // ── Phase 4: 기획팀 품질 관리 (병렬) ──────
    QualityInspectionsModule,
    // ── Phase 4: 통합 테스트 (컨펌 게이트 #4) ──
    IntegrationTestsModule,
    // ── Phase 5: 기획팀 (운영 가이드) ────────
    OperationGuidesModule,
    // ── Phase 5: 조달팀 (유지보수 계약) ──────
    MaintenanceContractsModule,
    // ── Phase 5: 3D/2D팀 (콘텐츠 업데이트) ───
    ContentUpdatesModule,
    // ── Phase 5: 종합 운영 리포트 (합류) ──────
    OperationReportsModule,
  ],
})
export class AppModule {}
