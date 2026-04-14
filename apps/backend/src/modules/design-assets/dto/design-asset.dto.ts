import { TeamType, AssetType, AssetStatus } from '../entities/design-asset.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateDesignAssetDto {
  projectId: string;
  name: string;
  teamType: TeamType;
  assetType: AssetType;
  fileUrl: string;
  thumbnailUrl?: string;
  fileFormat?: string;
  fileSize?: number;
  description?: string;
  uploadedBy?: string;
}

export class UpdateDesignAssetDto {
  name?: string;
  status?: AssetStatus;
  thumbnailUrl?: string;
  description?: string;
}

export class ListDesignAssetsDto extends PaginationInputDto {
  projectId?: string;
  teamType?: TeamType;
  assetType?: AssetType;
  status?: AssetStatus;
}
