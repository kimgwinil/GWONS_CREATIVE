import { InstallationStatus, InstallationItem, IntegrationTestResult, TechIssue } from '../entities/content-installation.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateContentInstallationDto {
  projectId: string;
  title: string;
  description?: string;
  installationItems?: InstallationItem[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  installationLead?: string;
  softwareOrderId?: string;
  constructionPlanId?: string;
  notes?: string;
}

export class UpdateContentInstallationDto {
  title?: string;
  description?: string;
  installationItems?: InstallationItem[];
  techIssues?: TechIssue[];
  plannedEndDate?: Date;
  notes?: string;
}

export class UpdateInstallationItemDto {
  status: 'pending' | 'installed' | 'failed' | 'rolled_back';
  actualDate?: string;
  errorLog?: string;
  notes?: string;
}

export class AddIntegrationTestDto {
  testName: string;
  targetSystems: string[];
  testedBy: string;
  result: 'pass' | 'fail' | 'partial';
  errorDetails?: string;
  notes?: string;
}

export class ListContentInstallationsDto extends PaginationInputDto {
  projectId?: string;
  status?: InstallationStatus;
}
