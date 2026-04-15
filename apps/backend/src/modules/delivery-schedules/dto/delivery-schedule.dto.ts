/**
 * GWONS_CREATIVE — DeliverySchedule DTOs
 */
import { DeliveryScheduleStatus, DeliveryEvent, InstallationLink } from '../entities/delivery-schedule.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateDeliveryScheduleDto {
  projectId: string;
  title: string;
  description?: string;
  deliveryEvents?: DeliveryEvent[];
  installationLinks?: InstallationLink[];
  targetCompletionDate?: Date;
  procurementListId?: string;
  notes?: string;
}

export class UpdateDeliveryScheduleDto {
  title?: string;
  description?: string;
  deliveryEvents?: DeliveryEvent[];
  installationLinks?: InstallationLink[];
  targetCompletionDate?: Date;
  notes?: string;
}

export class UpdateDeliveryEventDto {
  status: 'pending' | 'delivered' | 'delayed' | 'cancelled';
  actualDate?: string;
  delayDays?: number;
  delayReason?: string;
  notes?: string;
}

export class ListDeliverySchedulesDto extends PaginationInputDto {
  projectId?: string;
  status?: DeliveryScheduleStatus;
}
