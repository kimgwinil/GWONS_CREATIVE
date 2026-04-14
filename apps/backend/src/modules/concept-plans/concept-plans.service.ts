import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConceptPlan, ConceptPlanStatus } from './entities/concept-plan.entity';
import {
  CreateConceptPlanDto, UpdateConceptPlanDto,
  ApproveConceptPlanDto, ListConceptPlansDto,
} from './dto/concept-plan.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ConceptPlansService {
  constructor(
    @InjectRepository(ConceptPlan)
    private readonly planRepo: Repository<ConceptPlan>,
  ) {}

  async findAll(dto: ListConceptPlansDto): Promise<PaginatedResponse<ConceptPlan>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.theme)     where.theme     = dto.theme;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.planRepo, dto, where);
  }

  async findOne(id: string): Promise<ConceptPlan> {
    const plan = await this.planRepo.findOne({ where: { id }, relations: ['project'] });
    if (!plan) throw new NotFoundException(`콘셉트 기획서(${id})를 찾을 수 없습니다.`);
    return plan;
  }

  async create(dto: CreateConceptPlanDto): Promise<ConceptPlan> {
    const plan = this.planRepo.create({
      ...dto,
      circulationZones: dto.circulationZones ?? [],
      experienceElements: dto.experienceElements ?? [],
      linkedScenarioIds: dto.linkedScenarioIds ?? [],
      version: 1,
    });
    return this.planRepo.save(plan);
  }

  async update(id: string, dto: UpdateConceptPlanDto): Promise<ConceptPlan> {
    const plan = await this.findOne(id);
    if ([ConceptPlanStatus.APPROVED, ConceptPlanStatus.FINAL].includes(plan.status)) {
      throw new BadRequestException('승인/확정된 기획서는 수정할 수 없습니다. 새 버전을 생성하세요.');
    }
    plan.version += 1;
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  /** 검토 요청 */
  async submitForReview(id: string): Promise<ConceptPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== ConceptPlanStatus.DRAFT) {
      throw new BadRequestException('초안(draft) 상태만 검토 요청 가능합니다.');
    }
    if (!plan.conceptStatement) {
      throw new BadRequestException('핵심 콘셉트(conceptStatement)를 작성해야 합니다.');
    }
    plan.status = ConceptPlanStatus.IN_REVIEW;
    return this.planRepo.save(plan);
  }

  /** 승인 처리 */
  async approve(id: string, dto: ApproveConceptPlanDto): Promise<ConceptPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== ConceptPlanStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 승인 가능합니다.');
    }
    plan.status     = ConceptPlanStatus.APPROVED;
    plan.approvedBy = dto.approvedBy;
    plan.approvedAt = new Date();
    if (dto.reviewNotes) plan.reviewNotes = dto.reviewNotes;
    return this.planRepo.save(plan);
  }

  /** 최종 확정 (클라이언트 승인 후) */
  async finalize(id: string): Promise<ConceptPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== ConceptPlanStatus.APPROVED) {
      throw new BadRequestException('승인(approved) 상태만 최종 확정 가능합니다.');
    }
    plan.status = ConceptPlanStatus.FINAL;
    return this.planRepo.save(plan);
  }

  /** 반려 처리 */
  async reject(id: string, reviewNotes: string): Promise<ConceptPlan> {
    const plan = await this.findOne(id);
    plan.status      = ConceptPlanStatus.REJECTED;
    plan.reviewNotes = reviewNotes;
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}
