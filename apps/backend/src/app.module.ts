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
  ],
})
export class AppModule {}
