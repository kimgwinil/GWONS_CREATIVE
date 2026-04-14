import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketResearch } from './entities/market-research.entity';
import { MarketResearchesService } from './market-researches.service';
import { MarketResearchesController } from './market-researches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarketResearch])],
  controllers: [MarketResearchesController],
  providers: [MarketResearchesService],
  exports: [MarketResearchesService],
})
export class MarketResearchesModule {}
