import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignAsset } from './entities/design-asset.entity';
import { DesignAssetsService } from './design-assets.service';
import { DesignAssetsController } from './design-assets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DesignAsset])],
  controllers: [DesignAssetsController],
  providers: [DesignAssetsService],
  exports: [DesignAssetsService],
})
export class DesignAssetsModule {}
