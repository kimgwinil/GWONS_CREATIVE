/**
 * GWONS_CREATIVE — ProcurementListsService
 * 기획팀 + 조달팀: 최종 조달 목록 확정 서비스
 * Phase 3 병렬 발주 착수 트리거 역할
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProcurementList,
  ProcurementListStatus,
  BudgetSummary,
} from './entities/procurement-list.entity';
import {
  CreateProcurementListDto,
  UpdateProcurementListDto,
  ApproveProcurementListDto,
  ListProcurementListsDto,
} from './dto/procurement-list.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ProcurementListsService {
  constructor(
    @InjectRepository(ProcurementList)
    private readonly repo: Repository<ProcurementList>,
  ) {}

  async findAll(dto: ListProcurementListsDto): Promise<PaginatedResponse<ProcurementList>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<ProcurementList> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`조달 목록(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateProcurementListDto): Promise<ProcurementList> {
    const item = this.repo.create({
      ...dto,
      lineItems: dto.lineItems ?? [],
      contingencyRate: dto.contingencyRate ?? 10,
      version: 1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateProcurementListDto): Promise<ProcurementList> {
    const item = await this.findOne(id);
    if ([ProcurementListStatus.LOCKED].includes(item.status)) {
      throw new BadRequestException('잠금(locked) 상태의 조달 목록은 수정 불가합니다.');
    }
    if (item.status === ProcurementListStatus.APPROVED) {
      throw new BadRequestException('승인된 조달 목록은 수정 불가합니다. 잠금 해제 후 새 버전을 생성하세요.');
    }
    item.version += 1;
    // 예산 자동 재계산
    if (dto.lineItems) {
      item.lineItems = dto.lineItems;
      item.budgetSummary = this._calcBudget(dto.lineItems, item.contingencyRate);
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 기획팀 검토 요청 */
  async submitForReview(id: string): Promise<ProcurementList> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementListStatus.DRAFTING) {
      throw new BadRequestException('작성 중(drafting) 상태만 검토 요청 가능합니다.');
    }
    if (!item.lineItems?.length) {
      throw new BadRequestException('최소 1개 이상의 조달 항목(lineItems)이 필요합니다.');
    }
    // 예산 요약 자동 계산
    item.budgetSummary = this._calcBudget(item.lineItems, item.contingencyRate);
    item.status = ProcurementListStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 기획팀 최종 승인 → H/W·S/W 발주 병렬 착수 트리거 */
  async approve(id: string, dto: ApproveProcurementListDto): Promise<ProcurementList> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementListStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 승인 가능합니다.');
    }
    // critical 항목이 모두 포함되어 있는지 검증
    const criticals = item.lineItems.filter(li => li.priority === 'critical');
    if (criticals.length === 0) {
      throw new BadRequestException('critical 우선순위 조달 항목이 최소 1개 이상 필요합니다.');
    }
    item.status      = ProcurementListStatus.APPROVED;
    item.approvedBy  = dto.approvedBy;
    item.approvedAt  = new Date();
    if (dto.approvalNotes) item.approvalNotes = dto.approvalNotes;
    return this.repo.save(item);
  }

  /** 발주 시작 후 잠금 — 변경 불가 상태 */
  async lock(id: string): Promise<ProcurementList> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementListStatus.APPROVED) {
      throw new BadRequestException('승인된 조달 목록만 잠금 처리 가능합니다.');
    }
    item.status = ProcurementListStatus.LOCKED;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([ProcurementListStatus.APPROVED, ProcurementListStatus.LOCKED].includes(item.status)) {
      throw new BadRequestException('승인/잠금 상태의 조달 목록은 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }

  /** 카테고리별 예산 자동 계산 */
  private _calcBudget(lineItems: any[], contingencyRate: number): BudgetSummary {
    const sums: Record<string, number> = {
      hardware: 0, software: 0, content: 0, service: 0, material: 0,
    };
    for (const li of lineItems) {
      const cat = li.category ?? 'material';
      sums[cat] = (sums[cat] ?? 0) + (Number(li.estimatedTotalPrice) || 0);
    }
    const subtotal = Object.values(sums).reduce((a, b) => a + b, 0);
    const contingency = subtotal * (Number(contingencyRate) / 100);
    return {
      hardware:       sums.hardware,
      software:       sums.software,
      content:        sums.content,
      service:        sums.service,
      material:       sums.material,
      contingency,
      totalEstimated: subtotal + contingency,
    };
  }
}
