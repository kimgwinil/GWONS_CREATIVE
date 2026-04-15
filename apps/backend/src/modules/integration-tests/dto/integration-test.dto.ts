import { IntegrationTestStatus, Phase4Deliverable, SimulationScenario, FinalCheckItem, OperationIssue } from '../entities/integration-test.entity';
import { PaginationInputDto } from '../../../core/pagination/pagination.dto';

export class CreateIntegrationTestDto {
  projectId: string;
  title: string;
  executiveSummary?: string;
  constructionPlanId?: string;
  contentInstallationId?: string;
  internalNotes?: string;
}

export class UpdateIntegrationTestDto {
  title?: string;
  executiveSummary?: string;
  deliverables?: Phase4Deliverable[];
  simulations?: SimulationScenario[];
  finalChecklist?: FinalCheckItem[];
  operationIssues?: OperationIssue[];
  internalNotes?: string;
}

export class RunSimulationDto {
  simulatedBy: string;
  scenarioResults: Array<{
    scenarioId: string;
    overallResult: 'pass' | 'fail' | 'partial';
    stepResults?: Array<{
      stepNo: number;
      result: 'pass' | 'fail' | 'partial';
      actualResult?: string;
      testerNote?: string;
    }>;
  }>;
}

export class ApproveIntegrationTestDto {
  approvedBy: string;
  clientFeedback?: string;
}

export class ListIntegrationTestsDto extends PaginationInputDto {
  projectId?: string;
  status?: IntegrationTestStatus;
}
