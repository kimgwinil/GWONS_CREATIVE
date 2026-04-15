/**
 * GWONS_CREATIVE — ConstructionPlansService
 * 시공팀: 공간 시공 + 구조물 설치 관리
 * Phase 4 병렬 — 시공 트랙
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionPlan, ConstructionStatus, ConstructionTask } from './entities/construction-plan.entity';
import {
  CreateConstructionPlanDto, UpdateConstructionPlanDto,
  UpdateTaskProgressDto, InspectConstructionDto,
  ListConstructionPlansDto,
} from './dto/construction-plan.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ConstructionPlansService {
  constructor(
    @InjectRepository(ConstructionPlan)
    private readonly repo: Repository<ConstructionPlan>,
  ) {}

  async findAll(dto: ListConstructionPlansDto): Promise<PaginatedResponse<ConstructionPlan>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<ConstructionPlan> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`시공 계획서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateConstructionPlanDto): Promise<ConstructionPlan> {
    const tasks = dto.tasks ?? [];
    const item = this.repo.create({
      ...dto,
      tasks,
      structureItems: dto.structureItems ?? [],
      safetyChecks:   [],
      totalTasks:     tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      delayedTasks:   tasks.filter(t => t.status === 'delayed').length,
      overallProgressRate: this._calcProgress(tasks),
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateConstructionPlanDto): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if ([ConstructionStatus.COMPLETED, ConstructionStatus.INSPECTED].includes(item.status)) {
      throw new BadRequestException('완료/검수 완료 상태의 시공 계획은 수정 불가합니다.');
    }
    if (dto.tasks) {
      item.totalTasks     = dto.tasks.length;
      item.completedTasks = dto.tasks.filter(t => t.status === 'completed').length;
      item.delayedTasks   = dto.tasks.filter(t => t.status === 'delayed').length;
      item.overallProgressRate = this._calcProgress(dto.tasks);
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 시공 계획 승인 */
  async approve(id: string): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.PLANNING) {
      throw new BadRequestException('계획(planning) 상태만 승인 가능합니다.');
    }
    if (!item.tasks?.length) {
      throw new BadRequestException('시공 작업 항목(tasks)이 최소 1개 이상 필요합니다.');
    }
    if (!item.plannedEndDate) {
      throw new BadRequestException('시공 완료 목표일(plannedEndDate)을 설정해야 합니다.');
    }
    item.status = ConstructionStatus.APPROVED;
    return this.repo.save(item);
  }

  /** 시공 착수 */
  async start(id: string): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.APPROVED) {
      throw new BadRequestException('승인(approved) 상태만 시공 착수 가능합니다.');
    }
    item.status = ConstructionStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 작업 진행률 업데이트 */
  async updateTask(id: string, taskId: string, dto: UpdateTaskProgressDto): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.IN_PROGRESS && item.status !== ConstructionStatus.SUSPENDED) {
      throw new BadRequestException('진행 중 또는 중단 상태에서만 작업 업데이트 가능합니다.');
    }
    const task = item.tasks.find(t => t.taskId === taskId);
    if (!task) throw new BadRequestException(`작업(${taskId})을 찾을 수 없습니다.`);

    Object.assign(task, dto);

    // 집계 재계산
    item.completedTasks = item.tasks.filter(t => t.status === 'completed').length;
    item.delayedTasks   = item.tasks.filter(t => t.status === 'delayed').length;
    item.overallProgressRate = this._calcProgress(item.tasks);

    // 지연 작업 발생 시 상태 전환
    if (item.delayedTasks > 0 && item.status === ConstructionStatus.IN_PROGRESS) {
      // 지연이 있어도 in_progress 유지 (suspended는 명시적 중단 시만)
    }

    // 모든 작업 완료 시 자동 완료
    const activeTasks = item.tasks.filter(t => t.status !== 'blocked');
    if (activeTasks.length > 0 && activeTasks.every(t => t.status === 'completed')) {
      item.status    = ConstructionStatus.COMPLETED;
      item.actualEndDate = new Date();
    }

    return this.repo.save(item);
  }

  /** 시공 일시 중단 */
  async suspend(id: string, reason: string): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.IN_PROGRESS) {
      throw new BadRequestException('진행 중 상태만 중단 처리 가능합니다.');
    }
    item.status = ConstructionStatus.SUSPENDED;
    item.notes  = `[중단 사유] ${reason}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  /** 시공 재개 */
  async resume(id: string): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.SUSPENDED) {
      throw new BadRequestException('중단(suspended) 상태만 재개 가능합니다.');
    }
    item.status = ConstructionStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 시공 강제 완료 */
  async complete(id: string): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (![ConstructionStatus.IN_PROGRESS, ConstructionStatus.SUSPENDED].includes(item.status)) {
      throw new BadRequestException('진행 중/중단 상태만 완료 처리 가능합니다.');
    }
    item.status      = ConstructionStatus.COMPLETED;
    item.actualEndDate = new Date();
    return this.repo.save(item);
  }

  /** 준공 검수 */
  async inspect(id: string, dto: InspectConstructionDto): Promise<ConstructionPlan> {
    const item = await this.findOne(id);
    if (item.status !== ConstructionStatus.COMPLETED) {
      throw new BadRequestException('시공 완료(completed) 상태만 검수 가능합니다.');
    }
    if (dto.result === 'fail') {
      throw new BadRequestException('검수 불합격 시 시공 재작업이 필요합니다. 상태를 in_progress로 되돌리세요.');
    }
    item.status      = ConstructionStatus.INSPECTED;
    item.inspectedBy = dto.inspectedBy;
    item.inspectedAt = new Date();
    if (dto.findings) item.notes = `[검수 의견] ${dto.findings}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (![ConstructionStatus.PLANNING].includes(item.status)) {
      throw new BadRequestException('계획 중 상태만 삭제 가능합니다.');
    }
    await this.repo.remove(item);
  }

  /** 전체 진행률 계산 */
  private _calcProgress(tasks: ConstructionTask[]): number {
    if (!tasks.length) return 0;
    const sum = tasks.reduce((acc, t) => acc + (t.progressRate ?? 0), 0);
    return Math.round(sum / tasks.length);
  }
}
