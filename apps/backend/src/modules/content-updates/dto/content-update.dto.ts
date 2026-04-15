import { ContentUpdateStatus, UpdateType, UpdatePriority, UpdateTargetItem } from '../entities/content-update.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateContentUpdateDto {
  projectId: string;
  title: string;
  description?: string;
  updateType: UpdateType;
  priority?: UpdatePriority;
  targetItems?: UpdateTargetItem[];
  requestedBy?: string;
  assignedTo?: string;
  requestedDeadline?: Date;
  notes?: string;
}

export class UpdateContentUpdateDto {
  title?: string;
  description?: string;
  priority?: UpdatePriority;
  targetItems?: UpdateTargetItem[];
  assignedTo?: string;
  requestedDeadline?: Date;
  notes?: string;
}

export class ReviewContentUpdateDto {
  reviewedBy: string;
  result: 'approved' | 'rejected' | 'revision_needed';
  comment: string;
}

export class DeployContentUpdateDto {
  deployedBy: string;
  notes?: string;
}

export class UpdateItemStatusDto {
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export class ListContentUpdatesDto extends PaginationInputDto {
  projectId?: string;
  status?: ContentUpdateStatus;
  updateType?: UpdateType;
  priority?: UpdatePriority;
}
