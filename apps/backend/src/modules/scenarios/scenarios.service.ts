import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scenario, ScenarioStatus } from './entities/scenario.entity';
import {
  CreateScenarioDto, UpdateScenarioDto,
  ApproveScenarioDto, ListScenariosDto,
} from './dto/scenario.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ScenariosService {
  constructor(
    @InjectRepository(Scenario)
    private readonly scenarioRepo: Repository<Scenario>,
  ) {}

  /** 시나리오 목록 — 인풋 기반 페이징 */
  async findAll(dto: ListScenariosDto): Promise<PaginatedResponse<Scenario>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.type)      where.type      = dto.type;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.scenarioRepo, dto, where);
  }

  async findOne(id: string): Promise<Scenario> {
    const s = await this.scenarioRepo.findOne({ where: { id }, relations: ['project'] });
    if (!s) throw new NotFoundException(`시나리오(${id})를 찾을 수 없습니다.`);
    return s;
  }

  async create(dto: CreateScenarioDto): Promise<Scenario> {
    // steps 자동 totalDuration 계산
    const total = dto.steps?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) ?? 0;
    const scenario = this.scenarioRepo.create({
      ...dto,
      steps: dto.steps ?? [],
      totalDurationMinutes: dto.totalDurationMinutes ?? total,
    });
    return this.scenarioRepo.save(scenario);
  }

  async update(id: string, dto: UpdateScenarioDto): Promise<Scenario> {
    const scenario = await this.findOne(id);
    if (scenario.status === ScenarioStatus.APPROVED && dto.status !== ScenarioStatus.ARCHIVED) {
      throw new BadRequestException('승인된 시나리오는 아카이브 처리만 가능합니다.');
    }
    // steps 변경 시 totalDuration 재계산
    if (dto.steps) {
      dto.totalDurationMinutes = dto.steps.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    }
    Object.assign(scenario, dto);
    return this.scenarioRepo.save(scenario);
  }

  /** 시나리오 승인 처리 */
  async approve(id: string, dto: ApproveScenarioDto): Promise<Scenario> {
    const scenario = await this.findOne(id);
    if (scenario.status !== ScenarioStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태인 시나리오만 승인 가능합니다.');
    }
    scenario.status     = ScenarioStatus.APPROVED;
    scenario.approvedBy = dto.approvedBy;
    scenario.approvedAt = new Date();
    if (dto.reviewNotes) scenario.reviewNotes = dto.reviewNotes;
    return this.scenarioRepo.save(scenario);
  }

  /** 검토 요청 */
  async submitForReview(id: string): Promise<Scenario> {
    const scenario = await this.findOne(id);
    if (scenario.status !== ScenarioStatus.DRAFT) {
      throw new BadRequestException('초안(draft) 상태인 시나리오만 검토 요청 가능합니다.');
    }
    if (!scenario.steps || scenario.steps.length === 0) {
      throw new BadRequestException('시나리오 단계(steps)가 최소 1개 이상 있어야 합니다.');
    }
    scenario.status = ScenarioStatus.IN_REVIEW;
    return this.scenarioRepo.save(scenario);
  }

  async remove(id: string): Promise<void> {
    const scenario = await this.findOne(id);
    await this.scenarioRepo.remove(scenario);
  }
}
