/**
 * GWONS_CREATIVE — ContentUpdatesService
 * 3D/2D팀: 추가 콘텐츠 업데이트 지원
 * requested → in_progress → review → approved → deployed
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentUpdate, ContentUpdateStatus, ReviewFeedback } from './entities/content-update.entity';
import {
  CreateContentUpdateDto, UpdateContentUpdateDto,
  ReviewContentUpdateDto, DeployContentUpdateDto,
  UpdateItemStatusDto, ListContentUpdatesDto,
} from './dto/content-update.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ContentUpdatesService {
  constructor(
    @InjectRepository(ContentUpdate)
    private readonly repo: Repository<ContentUpdate>,
  ) {}

  async findAll(dto: ListContentUpdatesDto): Promise<PaginatedResponse<ContentUpdate>> {
    const where: any = {};
    if (dto.projectId)  where.projectId  = dto.projectId;
    if (dto.status)     where.status     = dto.status;
    if (dto.updateType) where.updateType = dto.updateType;
    if (dto.priority)   where.priority   = dto.priority;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<ContentUpdate> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`콘텐츠 업데이트(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateContentUpdateDto): Promise<ContentUpdate> {
    const targets = dto.targetItems ?? [];
    const item = this.repo.create({
      ...dto,
      targetItems:   targets,
      reviewHistory: [],
      totalItems:    targets.length,
      completedItems: targets.filter(t => t.status === 'completed').length,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateContentUpdateDto): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if ([ContentUpdateStatus.DEPLOYED, ContentUpdateStatus.REJECTED].includes(item.status)) {
      throw new BadRequestException('배포 완료/반려 상태는 수정 불가합니다.');
    }
    if (dto.targetItems !== undefined) {
      item.totalItems    = dto.targetItems.length;
      item.completedItems = dto.targetItems.filter(t => t.status === 'completed').length;
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 작업 착수 */
  async startWork(id: string): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if (item.status !== ContentUpdateStatus.REQUESTED) {
      throw new BadRequestException('요청(requested) 상태만 작업 착수 가능합니다.');
    }
    if (!item.targetItems?.length) {
      throw new BadRequestException('업데이트 대상 항목(targetItems)이 최소 1개 이상 필요합니다.');
    }
    item.status = ContentUpdateStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 개별 항목 상태 업데이트 */
  async updateItemStatus(id: string, itemId: string, dto: UpdateItemStatusDto): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if (item.status !== ContentUpdateStatus.IN_PROGRESS) {
      throw new BadRequestException('작업 중(in_progress) 상태에서만 항목 업데이트 가능합니다.');
    }
    const target = item.targetItems.find(t => t.itemId === itemId);
    if (!target) throw new BadRequestException(`항목(${itemId})을 찾을 수 없습니다.`);

    target.status = dto.status;
    item.completedItems = item.targetItems.filter(t => t.status === 'completed').length;
    return this.repo.save(item);
  }

  /** 검토 요청 */
  async submitForReview(id: string): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if (item.status !== ContentUpdateStatus.IN_PROGRESS) {
      throw new BadRequestException('작업 중(in_progress) 상태만 검토 요청 가능합니다.');
    }
    const pending = item.targetItems.filter(t => t.status === 'pending');
    if (pending.length > 0) {
      throw new BadRequestException(`미완료 항목이 ${pending.length}개 있습니다.`);
    }
    item.status = ContentUpdateStatus.REVIEW;
    return this.repo.save(item);
  }

  /** 검토 완료 */
  async review(id: string, dto: ReviewContentUpdateDto): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if (item.status !== ContentUpdateStatus.REVIEW) {
      throw new BadRequestException('검토 중(review) 상태만 리뷰 가능합니다.');
    }
    const feedback: ReviewFeedback = {
      reviewedBy: dto.reviewedBy,
      reviewedAt: new Date().toISOString(),
      result:     dto.result,
      comment:    dto.comment,
    };
    item.reviewHistory = [...item.reviewHistory, feedback];

    if (dto.result === 'approved') {
      item.status = ContentUpdateStatus.APPROVED;
    } else if (dto.result === 'rejected') {
      item.status = ContentUpdateStatus.REJECTED;
    } else {
      // revision_needed → back to in_progress
      item.status = ContentUpdateStatus.IN_PROGRESS;
    }
    return this.repo.save(item);
  }

  /** 현장 배포 */
  async deploy(id: string, dto: DeployContentUpdateDto): Promise<ContentUpdate> {
    const item = await this.findOne(id);
    if (item.status !== ContentUpdateStatus.APPROVED) {
      throw new BadRequestException('승인(approved) 상태만 배포 가능합니다.');
    }
    item.status     = ContentUpdateStatus.DEPLOYED;
    item.deployedBy = dto.deployedBy;
    item.deployedAt = new Date();
    if (dto.notes) item.notes = `[배포 메모] ${dto.notes}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([ContentUpdateStatus.APPROVED, ContentUpdateStatus.DEPLOYED].includes(item.status)) {
      throw new BadRequestException('승인/배포 완료 상태는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
