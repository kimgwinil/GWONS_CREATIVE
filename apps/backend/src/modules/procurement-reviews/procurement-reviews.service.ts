/**
 * GWONS_CREATIVE — ProcurementReviewsService
 * 기획팀: Phase 3 조달 통합 검토 + 컨펌 게이트 #3
 * collecting → in_review → budget_check → client_review → approved
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcurementReview, ProcurementReviewStatus } from './entities/procurement-review.entity';
import {
  CreateProcurementReviewDto, UpdateProcurementReviewDto,
  ApproveProcurementReviewDto, ListProcurementReviewsDto,
} from './dto/procurement-review.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ProcurementReviewsService {
  constructor(
    @InjectRepository(ProcurementReview)
    private readonly repo: Repository<ProcurementReview>,
  ) {}

  async findAll(dto: ListProcurementReviewsDto): Promise<PaginatedResponse<ProcurementReview>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<ProcurementReview> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`조달 검토서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateProcurementReviewDto): Promise<ProcurementReview> {
    const item = this.repo.create({
      ...dto,
      deliverables:      [],
      budgetComparisons: [],
      procurementIssues: [],
      version:           1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateProcurementReviewDto): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    if (item.status === ProcurementReviewStatus.APPROVED) {
      throw new BadRequestException('승인된 검토서는 수정 불가합니다.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 수집 완료 → 기획팀 통합 검토 시작 */
  async submitForReview(id: string): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementReviewStatus.COLLECTING) {
      throw new BadRequestException('수집 중(collecting) 상태만 검토 요청 가능합니다.');
    }
    const incompleteDeliverables = item.deliverables.filter(d => !d.isCompleted);
    if (incompleteDeliverables.length > 0) {
      throw new BadRequestException(
        `미완료 산출물이 있습니다: ${incompleteDeliverables.map(d => d.deliverableTitle).join(', ')}`
      );
    }
    item.status = ProcurementReviewStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 예산 최종 확인 단계 */
  async proceedToBudgetCheck(id: string): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementReviewStatus.IN_REVIEW) {
      throw new BadRequestException('기획팀 검토 중(in_review) 상태만 예산 확인 단계로 이동 가능합니다.');
    }
    // critical 이슈 미해결 차단
    const openCriticals = item.procurementIssues.filter(
      i => i.severity === 'critical' && i.status === 'open',
    );
    if (openCriticals.length > 0) {
      throw new BadRequestException(
        `Critical 이슈 ${openCriticals.length}건이 미해결 상태입니다.`
      );
    }
    item.status = ProcurementReviewStatus.BUDGET_CHECK;
    return this.repo.save(item);
  }

  /** 클라이언트 제출 (예산 확인 후) */
  async submitToClient(id: string): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementReviewStatus.BUDGET_CHECK) {
      throw new BadRequestException('예산 확인(budget_check) 상태만 클라이언트 제출 가능합니다.');
    }
    item.status = ProcurementReviewStatus.CLIENT_REVIEW;
    return this.repo.save(item);
  }

  /** 컨펌 게이트 #3 — 클라이언트 최종 승인 → Phase 4 착수 */
  async approve(id: string, dto: ApproveProcurementReviewDto): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    if (item.status !== ProcurementReviewStatus.CLIENT_REVIEW) {
      throw new BadRequestException('클라이언트 검토(client_review) 상태만 승인 가능합니다.');
    }
    item.status     = ProcurementReviewStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    if (dto.clientFeedback) item.clientFeedback = dto.clientFeedback;
    return this.repo.save(item);
  }

  /** 반려 */
  async reject(id: string, feedback: string): Promise<ProcurementReview> {
    const item = await this.findOne(id);
    item.status         = ProcurementReviewStatus.REJECTED;
    item.clientFeedback = feedback;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
