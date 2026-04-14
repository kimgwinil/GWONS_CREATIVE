import { RenderAssetType, RenderAssetStatus, RenderViewType, LodLevel, RenderSettings } from '../entities/render-asset.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateRenderAssetDto {
  projectId: string;
  title: string;
  description?: string;
  assetType: RenderAssetType;
  viewType?: RenderViewType;
  sourceFileUrl?: string;
  outputFileUrl?: string;
  thumbnailUrl?: string;
  fileFormat?: string;
  fileSizeBytes?: number;
  lodLevel?: LodLevel;
  renderSettings?: RenderSettings;
  targetZoneId?: string;
  createdBy?: string;
  basicDesignId?: string;
}

export class UpdateRenderAssetDto {
  title?: string;
  description?: string;
  viewType?: RenderViewType;
  sourceFileUrl?: string;
  outputFileUrl?: string;
  thumbnailUrl?: string;
  lodLevel?: LodLevel;
  renderSettings?: RenderSettings;
  reviewNotes?: string;
}

export class ListRenderAssetsDto extends PaginationInputDto {
  projectId?: string;
  assetType?: RenderAssetType;
  viewType?: RenderViewType;
  status?: RenderAssetStatus;
}
