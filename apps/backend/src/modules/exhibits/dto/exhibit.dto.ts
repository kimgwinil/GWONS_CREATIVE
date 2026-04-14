import { ExhibitCategory, ExhibitStatus } from '../entities/exhibit.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateExhibitDto {
  projectId: string;
  title: string;
  description?: string;
  category?: ExhibitCategory;
  sequence?: number;
  durationMinutes?: number;
  capacityPerSession?: number;
  scenario?: Record<string, unknown>;
}

export class UpdateExhibitDto {
  title?: string;
  description?: string;
  category?: ExhibitCategory;
  status?: ExhibitStatus;
  sequence?: number;
  durationMinutes?: number;
  capacityPerSession?: number;
  scenario?: Record<string, unknown>;
}

export class ListExhibitsDto extends PaginationInputDto {
  projectId?: string;
  status?: ExhibitStatus;
  category?: ExhibitCategory;
}
