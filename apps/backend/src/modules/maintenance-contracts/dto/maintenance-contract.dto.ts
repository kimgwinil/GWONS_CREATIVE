import { ContractStatus, ContractType, MaintenanceScope, SLAClause, MaintenanceRecord } from '../entities/maintenance-contract.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateMaintenanceContractDto {
  projectId: string;
  title: string;
  contractNo?: string;
  description?: string;
  contractType: ContractType;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  contractAmount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  maintenanceScope?: MaintenanceScope[];
  slaClauses?: SLAClause[];
  managedBy?: string;
  notes?: string;
}

export class UpdateMaintenanceContractDto {
  title?: string;
  description?: string;
  vendorContact?: string;
  vendorEmail?: string;
  contractAmount?: number;
  startDate?: Date;
  endDate?: Date;
  maintenanceScope?: MaintenanceScope[];
  slaClauses?: SLAClause[];
  contractFileUrl?: string;
  managedBy?: string;
  notes?: string;
}

export class SignContractDto {
  signedBy: string;
  contractFileUrl?: string;
  notes?: string;
}

export class AddMaintenanceRecordDto {
  visitedBy: string;
  targetItems: string[];
  workType: 'inspection' | 'repair' | 'replacement' | 'update';
  description: string;
  result: 'completed' | 'partial' | 'pending';
  nextScheduledDate?: string;
  cost?: number;
  notes?: string;
}

export class ListMaintenanceContractsDto extends PaginationInputDto {
  projectId?: string;
  status?: ContractStatus;
  contractType?: ContractType;
}
