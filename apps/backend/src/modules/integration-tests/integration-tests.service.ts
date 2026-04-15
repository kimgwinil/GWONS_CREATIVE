/**
 * GWONS_CREATIVE — IntegrationTestsService
 * 기획팀: 전시 통합 테스트 + 컨펌 게이트 #4
 * preparing → in_simulation → in_review → client_review → approved
 * 통과 시 Phase 5(운영) 착수
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationTest, IntegrationTestStatus, SimulationScenario } from './entities/integration-test.entity';
import {
  CreateIntegrationTestDto, UpdateIntegrationTestDto,
  RunSimulationDto, ApproveIntegrationTestDto,
  ListIntegrationTestsDto,
} from './dto/integration-test.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class IntegrationTestsService {
  constructor(
    @InjectRepository(IntegrationTest)
    private readonly repo: Repository<IntegrationTest>,
  ) {}

  async findAll(dto: ListIntegrationTestsDto): Promise<PaginatedResponse<IntegrationTest>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<IntegrationTest> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`통합 테스트(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateIntegrationTestDto): Promise<IntegrationTest> {
    const item = this.repo.create({
      ...dto,
      deliverables:    [],
      simulations:     [],
      finalChecklist:  [],
      operationIssues: [],
      version:         1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateIntegrationTestDto): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status === IntegrationTestStatus.APPROVED) {
      throw new BadRequestException('승인된 통합 테스트는 수정 불가합니다.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 시뮬레이션 착수 */
  async startSimulation(id: string): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status !== IntegrationTestStatus.PREPARING) {
      throw new BadRequestException('준비(preparing) 상태만 시뮬레이션 착수 가능합니다.');
    }
    if (!item.simulations?.length) {
      throw new BadRequestException('시뮬레이션 시나리오(simulations)가 최소 1개 이상 필요합니다.');
    }
    // 산출물 체크
    const incompleteDeliverables = item.deliverables.filter(d => !d.isCompleted);
    if (incompleteDeliverables.length > 0) {
      throw new BadRequestException(
        `미완료 산출물이 있습니다: ${incompleteDeliverables.map(d => d.deliverableTitle).join(', ')}`
      );
    }
    item.status = IntegrationTestStatus.IN_SIMULATION;
    return this.repo.save(item);
  }

  /** 시뮬레이션 실행 및 결과 기록 */
  async runSimulation(id: string, dto: RunSimulationDto): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status !== IntegrationTestStatus.IN_SIMULATION) {
      throw new BadRequestException('시뮬레이션 진행 중 상태만 결과 입력 가능합니다.');
    }
    // 시나리오별 결과 업데이트
    for (const scenarioResult of dto.scenarioResults) {
      const scenario = item.simulations.find(s => s.scenarioId === scenarioResult.scenarioId);
      if (!scenario) continue;

      scenario.overallResult = scenarioResult.overallResult;
      scenario.simulatedAt   = new Date().toISOString();
      scenario.simulatedBy   = dto.simulatedBy;

      if (scenarioResult.stepResults) {
        for (const stepRes of scenarioResult.stepResults) {
          const step = scenario.steps.find(s => s.stepNo === stepRes.stepNo);
          if (step) {
            step.result       = stepRes.result;
            step.actualResult = stepRes.actualResult;
            step.testerNote   = stepRes.testerNote;
          }
        }
        scenario.passedSteps = scenario.steps.filter(s => s.result === 'pass').length;
      }
    }
    // 전체 시뮬레이션 결과 집계
    const allResults = item.simulations.filter(s => s.overallResult).map(s => s.overallResult!);
    if (allResults.length > 0) {
      const hasFail    = allResults.some(r => r === 'fail');
      const hasPartial = allResults.some(r => r === 'partial');
      item.simulationResult = hasFail ? 'fail' : hasPartial ? 'partial' : 'pass';
      item.isFullyPassed    = !hasFail && !hasPartial;
    }
    return this.repo.save(item);
  }

  /** 기획팀 내부 검토 요청 */
  async submitForReview(id: string): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status !== IntegrationTestStatus.IN_SIMULATION) {
      throw new BadRequestException('시뮬레이션 진행 중 상태만 검토 요청 가능합니다.');
    }
    const pending = item.simulations.filter(s => !s.overallResult);
    if (pending.length > 0) {
      throw new BadRequestException(`미완료 시뮬레이션 시나리오가 ${pending.length}개 있습니다.`);
    }
    item.status = IntegrationTestStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 클라이언트 제출 */
  async submitToClient(id: string): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status !== IntegrationTestStatus.IN_REVIEW) {
      throw new BadRequestException('기획팀 검토 중(in_review) 상태만 클라이언트 제출 가능합니다.');
    }
    // critical 이슈 미해결 차단
    const openCriticals = item.operationIssues.filter(i => i.severity === 'critical' && i.status === 'open');
    if (openCriticals.length > 0) {
      throw new BadRequestException(`Critical 운영 이슈 ${openCriticals.length}건이 미해결 상태입니다.`);
    }
    item.status = IntegrationTestStatus.CLIENT_REVIEW;
    return this.repo.save(item);
  }

  /** 컨펌 게이트 #4 — 클라이언트 최종 승인 → Phase 5 착수 */
  async approve(id: string, dto: ApproveIntegrationTestDto): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    if (item.status !== IntegrationTestStatus.CLIENT_REVIEW) {
      throw new BadRequestException('클라이언트 검토(client_review) 상태만 승인 가능합니다.');
    }
    item.status     = IntegrationTestStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    if (dto.clientFeedback) item.clientFeedback = dto.clientFeedback;
    return this.repo.save(item);
  }

  /** 반려 */
  async reject(id: string, feedback: string): Promise<IntegrationTest> {
    const item = await this.findOne(id);
    item.status         = IntegrationTestStatus.REJECTED;
    item.clientFeedback = feedback;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.status === IntegrationTestStatus.APPROVED) {
      throw new BadRequestException('승인된 통합 테스트는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
