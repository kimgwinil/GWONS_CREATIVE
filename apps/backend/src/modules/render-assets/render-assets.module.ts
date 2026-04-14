import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RenderAsset } from './entities/render-asset.entity';
import { RenderAssetsService } from './render-assets.service';
import { RenderAssetsController } from './render-assets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RenderAsset])],
  controllers: [RenderAssetsController],
  providers: [RenderAssetsService],
  exports: [RenderAssetsService],
})
export class RenderAssetsModule {}
