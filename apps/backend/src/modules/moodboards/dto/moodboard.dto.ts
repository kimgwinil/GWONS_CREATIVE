import { MoodboardStatus, SpaceMood, ReferenceItem, ColorPaletteItem } from '../entities/moodboard.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateMoodboardDto {
  projectId: string;
  title: string;
  description?: string;
  mood?: SpaceMood;
  references?: ReferenceItem[];
  colorPalette?: ColorPaletteItem[];
  materialKeywords?: string[];
  lightingConcept?: string;
  createdBy?: string;
  conceptPlanId?: string;
}

export class UpdateMoodboardDto {
  title?: string;
  description?: string;
  mood?: SpaceMood;
  references?: ReferenceItem[];
  colorPalette?: ColorPaletteItem[];
  materialKeywords?: string[];
  lightingConcept?: string;
}

export class ListMoodboardsDto extends PaginationInputDto {
  projectId?: string;
  mood?: SpaceMood;
  status?: MoodboardStatus;
}
