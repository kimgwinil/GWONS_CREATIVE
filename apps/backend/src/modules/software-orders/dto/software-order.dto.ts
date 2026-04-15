/**
 * GWONS_CREATIVE — SoftwareOrder DTOs
 */
import { SoftwareOrderStatus, SoftwareOrderType, DevMilestone, TechRequirement, TestResult } from '../entities/software-order.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateSoftwareOrderDto {
  projectId: string;
  orderNo: string;
  title: string;
  orderType: SoftwareOrderType;
  vendorName: string;
  vendorContact?: string;
  contractAmount?: number;
  currency?: 'KRW' | 'USD' | 'EUR';
  isCustomDevelopment?: boolean;
  techRequirements?: TechRequirement[];
  milestones?: DevMilestone[];
  licenseCount?: number;
  licenseMonths?: number;
  requiredDeliveryDate?: Date;
  notes?: string;
  procurementListId?: string;
  orderedBy?: string;
}

export class UpdateSoftwareOrderDto {
  title?: string;
  vendorContact?: string;
  contractAmount?: number;
  techRequirements?: TechRequirement[];
  milestones?: DevMilestone[];
  requiredDeliveryDate?: Date;
  expectedDeliveryDate?: Date;
  contractFileUrl?: string;
  deliverableFileUrl?: string;
  notes?: string;
}

export class TestSoftwareOrderDto {
  testedBy: string;
  totalTestCases: number;
  passedCases: number;
  failedCases: number;
  issues?: string[];
  overallResult: 'pass' | 'fail' | 'conditional_pass';
}

export class ListSoftwareOrdersDto extends PaginationInputDto {
  projectId?: string;
  status?: SoftwareOrderStatus;
  orderType?: SoftwareOrderType;
}
