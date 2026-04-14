import { SketchType, SketchStatus, SketchZone, DimensionInfo } from '../entities/layout-sketch.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateLayoutSketchDto {
  projectId: string;
  title: string;
  description?: string;
  sketchType?: SketchType;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileFormat?: string;
  zones?: SketchZone[];
  dimensions?: DimensionInfo;
  floorNumber?: number;
  createdBy?: string;
  conceptPlanId?: string;
}

export class UpdateLayoutSketchDto {
  title?: string;
  description?: string;
  sketchType?: SketchType;
  fileUrl?: string;
  thumbnailUrl?: string;
  zones?: SketchZone[];
  dimensions?: DimensionInfo;
  floorNumber?: number;
  revisionNotes?: string;
}

export class ListLayoutSketchesDto extends PaginationInputDto {
  projectId?: string;
  sketchType?: SketchType;
  status?: SketchStatus;
  floorNumber?: number;
}
