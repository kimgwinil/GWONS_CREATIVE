/**
 * GWONS_CREATIVE — Database Module (TypeORM + PostgreSQL)
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Project } from '../../modules/projects/entities/project.entity';
import { Exhibit } from '../../modules/exhibits/entities/exhibit.entity';
import { DesignAsset } from '../../modules/design-assets/entities/design-asset.entity';
import { ProcurementItem } from '../../modules/procurement/entities/procurement-item.entity';
// Phase 1
import { Scenario } from '../../modules/scenarios/entities/scenario.entity';
import { ConceptPlan } from '../../modules/concept-plans/entities/concept-plan.entity';
import { Moodboard } from '../../modules/moodboards/entities/moodboard.entity';
import { LayoutSketch } from '../../modules/layout-sketches/entities/layout-sketch.entity';
import { IntegratedPlan } from '../../modules/integrated-plans/entities/integrated-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get('DB_HOST', 'localhost'),
        port:     config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'gwons'),
        password: config.get('DB_PASS', 'gwons_pass'),
        database: config.get('DB_NAME', 'gwons_creative'),
        entities: [
          // Phase 0
          Project, Exhibit, DesignAsset, ProcurementItem,
          // Phase 1
          Scenario, ConceptPlan, Moodboard, LayoutSketch, IntegratedPlan,
        ],
        synchronize: config.get('NODE_ENV', 'development') === 'development',
        logging: config.get('NODE_ENV', 'development') === 'development',
        ssl: config.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
