import { DrawingDiscipline, DrawingType, DrawingStatus, DrawingLayer } from '../entities/cad-drawing.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateCadDrawingDto {
  projectId: string;
  drawingNo: string;
  title: string;
  description?: string;
  discipline: DrawingDiscipline;
  drawingType: DrawingType;
  scale?: string;
  paperSize?: string;
  floorNumber?: number;
  fileUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  layers?: DrawingLayer[];
  drawnBy?: string;
  basicDesignId?: string;
}

export class UpdateCadDrawingDto {
  title?: string;
  description?: string;
  scale?: string;
  fileUrl?: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  layers?: DrawingLayer[];
  checkedBy?: string;
}

export class IssueDrawingDto {
  approvedBy: string;
  revisionDescription: string;
}

export class ListCadDrawingsDto extends PaginationInputDto {
  projectId?: string;
  discipline?: DrawingDiscipline;
  drawingType?: DrawingType;
  status?: DrawingStatus;
  floorNumber?: number;
}
