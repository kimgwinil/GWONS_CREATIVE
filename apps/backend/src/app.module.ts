/**
 * GWONS_CREATIVE — App Root Module
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ExhibitsModule } from './modules/exhibits/exhibits.module';
import { DesignAssetsModule } from './modules/design-assets/design-assets.module';
import { ProcurementModule } from './modules/procurement/procurement.module';

@Module({
  imports: [
    // 환경 변수 전역 로드
    ConfigModule.forRoot({ isGlobal: true }),
    // 데이터베이스
    DatabaseModule,
    // 기획팀 도메인
    ProjectsModule,
    ExhibitsModule,
    // 3D/2D 디자인팀 도메인
    DesignAssetsModule,
    // 조달팀 도메인
    ProcurementModule,
  ],
})
export class AppModule {}
