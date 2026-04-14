import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegratedPlan, IntegratedPlanStatus } from './entities/integrated-plan.entity';
import {
  CreateIntegratedPlanDto, UpdateIntegratedPlanDto,
  ApproveIntegratedPlanDto, ListIntegratedPlansDto,
} from './dto/integrated-plan.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class IntegratedPlansService {
  constructor(
    @InjectRepository(IntegratedPlan)
    private readonly planRepo: Repository<IntegratedPlan>,
  ) {}

  async findAll(dto: ListIntegratedPlansDto): Promise<PaginatedResponse<IntegratedPlan>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.planRepo, dto, where);
  }

  async findOne(id: string): Promise<IntegratedPlan> {
    const plan = await this.planRepo.findOne({ where: { id }, relations: ['project'] });
    if (!plan) throw new NotFoundException(`통합 기획서(${id})를 찾을 수 없습니다.`);
    return plan;
  }

  async create(dto: CreateIntegratedPlanDto): Promise<IntegratedPlan> {
    const plan = this.planRepo.create({
      ...dto,
      deliverables: dto.deliverables ?? [
        { teamName: '기획팀',     deliverableType: 'scenario',       deliverableId: dto.scenarioId    ?? '', deliverableTitle: '전시 시나리오',  isCompleted: !!dto.scenarioId },
        { teamName: '기획팀',     deliverableType: 'concept_plan',   deliverableId: dto.conceptPlanId ?? '', deliverableTitle: '콘셉트 기획서',  isCompleted: !!dto.conceptPlanId },
        { teamName: '3D디자인팀', deliverableType: 'moodboard',      deliverableId: dto.moodboardId   ?? '', deliverableTitle: '무드보드',        isCompleted: !!dto.moodboardId },
        { teamName: '2D디자인팀', deliverableType: 'layout_sketch',  deliverableId: dto.layoutSketchId ?? '', deliverableTitle: '레이아웃 스케치', isCompleted: !!dto.layoutSketchId },
      ],
      version: 1,
    });
    return this.planRepo.save(plan);
  }

  async update(id: string, dto: UpdateIntegratedPlanDto): Promise<IntegratedPlan> {
    const plan = await this.findOne(id);
    if ([IntegratedPlanStatus.APPROVED].includes(plan.status)) {
      throw new BadRequestException('승인된 통합 기획서는 수정할 수 없습니다.');
    }
    plan.version += 1;
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  /** 내부 검토 요청 */
  async submitForReview(id: string): Promise<IntegratedPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== IntegratedPlanStatus.ASSEMBLING) {
      throw new BadRequestException('취합 중(assembling) 상태만 검토 요청 가능합니다.');
    }
    // 모든 산출물 완료 여부 확인
    const incomplete = plan.deliverables.filter(d => !d.isCompleted);
    if (incomplete.length > 0) {
      throw new BadRequestException(
        `미완료 산출물이 있습니다: ${incomplete.map(d => d.deliverableTitle).join(', ')}`
      );
    }
    plan.status = IntegratedPlanStatus.IN_REVIEW;
    return this.planRepo.save(plan);
  }

  /** 클라이언트 검토 요청 */
  async submitToClient(id: string): Promise<IntegratedPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== IntegratedPlanStatus.IN_REVIEW) {
      throw new BadRequestException('내부 검토(in_review) 상태만 클라이언트 제출 가능합니다.');
    }
    plan.status = IntegratedPlanStatus.CLIENT_REVIEW;
    return this.planRepo.save(plan);
  }

  /** 클라이언트 최종 승인 → 컨펌 게이트 #1 통과 */
  async approve(id: string, dto: ApproveIntegratedPlanDto): Promise<IntegratedPlan> {
    const plan = await this.findOne(id);
    if (plan.status !== IntegratedPlanStatus.CLIENT_REVIEW) {
      throw new BadRequestException('클라이언트 검토(client_review) 상태만 승인 가능합니다.');
    }
    plan.status        = IntegratedPlanStatus.APPROVED;
    plan.approvedBy    = dto.approvedBy;
    plan.approvedAt    = new Date();
    if (dto.clientFeedback) plan.clientFeedback = dto.clientFeedback;
    return this.planRepo.save(plan);
  }

  /** 반려 처리 */
  async reject(id: string, feedback: string): Promise<IntegratedPlan> {
    const plan = await this.findOne(id);
    plan.status         = IntegratedPlanStatus.REJECTED;
    plan.clientFeedback = feedback;
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}
