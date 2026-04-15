/**
 * GWONS_CREATIVE — OperationGuidesService
 * 기획팀: 오픈 운영 가이드 작성 및 전달
 * drafting → in_review → approved → delivered (→ revised)
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationGuide, OperationGuideStatus } from './entities/operation-guide.entity';
import {
  CreateOperationGuideDto, UpdateOperationGuideDto,
  ApproveOperationGuideDto, DeliverOperationGuideDto,
  ListOperationGuidesDto,
} from './dto/operation-guide.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class OperationGuidesService {
  constructor(
    @InjectRepository(OperationGuide)
    private readonly repo: Repository<OperationGuide>,
  ) {}

  async findAll(dto: ListOperationGuidesDto): Promise<PaginatedResponse<OperationGuide>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    if (dto.category)  where.category  = dto.category;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<OperationGuide> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`운영 가이드(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateOperationGuideDto): Promise<OperationGuide> {
    const item = this.repo.create({
      ...dto,
      steps:              dto.steps ?? [],
      emergencyContacts:  dto.emergencyContacts ?? [],
      operatingSchedule:  dto.operatingSchedule ?? [],
      version:            1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateOperationGuideDto): Promise<OperationGuide> {
    const item = await this.findOne(id);
    if (item.status === OperationGuideStatus.DELIVERED) {
      throw new BadRequestException('전달 완료된 가이드는 수정 불가합니다. 개정(revise)을 사용하세요.');
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 내부 검토 요청 */
  async submitForReview(id: string): Promise<OperationGuide> {
    const item = await this.findOne(id);
    if (item.status !== OperationGuideStatus.DRAFTING && item.status !== OperationGuideStatus.REVISED) {
      throw new BadRequestException('작성 중 또는 개정 상태만 검토 요청 가능합니다.');
    }
    if (!item.steps?.length) {
      throw new BadRequestException('운영 절차(steps)가 최소 1개 이상 필요합니다.');
    }
    item.status = OperationGuideStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 승인 */
  async approve(id: string, dto: ApproveOperationGuideDto): Promise<OperationGuide> {
    const item = await this.findOne(id);
    if (item.status !== OperationGuideStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 승인 가능합니다.');
    }
    item.status     = OperationGuideStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    if (dto.notes) item.notes = dto.notes;
    return this.repo.save(item);
  }

  /** 현장 전달 */
  async deliver(id: string, dto: DeliverOperationGuideDto): Promise<OperationGuide> {
    const item = await this.findOne(id);
    if (item.status !== OperationGuideStatus.APPROVED) {
      throw new BadRequestException('승인(approved) 상태만 전달 가능합니다.');
    }
    item.status      = OperationGuideStatus.DELIVERED;
    item.deliveredTo = dto.deliveredTo;
    item.deliveredAt = new Date();
    if (dto.notes) item.notes = `[전달 메모] ${dto.notes}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  /** 개정 (버전 업) */
  async revise(id: string): Promise<OperationGuide> {
    const item = await this.findOne(id);
    if (item.status !== OperationGuideStatus.DELIVERED) {
      throw new BadRequestException('전달 완료(delivered) 상태만 개정 가능합니다.');
    }
    item.status  = OperationGuideStatus.REVISED;
    item.version += 1;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([OperationGuideStatus.APPROVED, OperationGuideStatus.DELIVERED].includes(item.status)) {
      throw new BadRequestException('승인/전달 완료 상태의 가이드는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
