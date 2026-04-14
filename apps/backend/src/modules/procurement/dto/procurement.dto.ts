import { ProcurementCategory, ProcurementStatus } from '../entities/procurement-item.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateProcurementItemDto {
  projectId: string;
  name: string;
  description?: string;
  category: ProcurementCategory;
  isCustomizable?: boolean;
  customSpec?: string;
  quantity?: number;
  unit?: string;
  estimatedCost?: number;
  vendor?: string;
  expectedDeliveryDate?: Date;
  marketResearch?: Array<{
    vendor: string;
    price: number;
    deliveryDays: number;
    notes: string;
  }>;
}

export class UpdateProcurementItemDto {
  name?: string;
  description?: string;
  status?: ProcurementStatus;
  isCustomizable?: boolean;
  customSpec?: string;
  quantity?: number;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  marketResearch?: Array<{
    vendor: string;
    price: number;
    deliveryDays: number;
    notes: string;
  }>;
}

export class ListProcurementDto extends PaginationInputDto {
  projectId?: string;
  category?: ProcurementCategory;
  status?: ProcurementStatus;
}
