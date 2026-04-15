/**
 * GWONS_CREATIVE — SiteVisualizationsService
 * 3D 디자인팀: 현장 시각화 지원·수정
 * Phase 4 병렬 — 3D 시각화 트랙
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteVisualization, SiteVisualizationStatus, RevisionRecord } from './entities/site-visualization.entity';
import {
  CreateSiteVisualizationDto, UpdateSiteVisualizationDto,
  RequestRevisionDto, CompleteRevisionDto,
  ApproveVisualizationDto, ListSiteVisualizationsDto,
} from './dto/site-visualization.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class SiteVisualizationsService {
  constructor(
    @InjectRepository(SiteVisualization)
    private readonly repo: Repository<SiteVisualization>,
  ) {}

  async findAll(dto: ListSiteVisualizationsDto): Promise<PaginatedResponse<SiteVisualization>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    if (dto.vizType)   where.vizType   = dto.vizType;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<SiteVisualization> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`현장 시각화(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateSiteVisualizationDto): Promise<SiteVisualization> {
    const item = this.repo.create({
      ...dto,
      revisionHistory: [],
      comparisonData:  [],
      currentRevision: 0,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateSiteVisualizationDto): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (item.status === SiteVisualizationStatus.FINAL) {
      throw new BadRequestException('최종 확정(final) 상태는 수정 불가합니다.');
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 검토 요청 */
  async submitForReview(id: string): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (![SiteVisualizationStatus.DRAFT, SiteVisualizationStatus.REVISION].includes(item.status)) {
      throw new BadRequestException('초안 또는 수정 중 상태만 검토 요청 가능합니다.');
    }
    if (!item.outputFileUrl && !item.sourceFileUrl) {
      throw new BadRequestException('파일(sourceFileUrl 또는 outputFileUrl)이 필요합니다.');
    }
    item.status = SiteVisualizationStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 현장 반영 수정 요청 */
  async requestRevision(id: string, dto: RequestRevisionDto): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (item.status !== SiteVisualizationStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 수정 요청 가능합니다.');
    }
    item.currentRevision += 1;
    const record: RevisionRecord = {
      revNo:       item.currentRevision,
      requestedBy: dto.requestedBy,
      requestedAt: new Date().toISOString(),
      reason:      dto.reason,
      description: dto.description,
    };
    item.revisionHistory = [...item.revisionHistory, record];
    item.status = SiteVisualizationStatus.REVISION;
    return this.repo.save(item);
  }

  /** 수정 완료 */
  async completeRevision(id: string, dto: CompleteRevisionDto): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (item.status !== SiteVisualizationStatus.REVISION) {
      throw new BadRequestException('수정 중(revision) 상태만 완료 처리 가능합니다.');
    }
    // 최근 수정 이력 업데이트
    const lastRev = item.revisionHistory[item.revisionHistory.length - 1];
    if (lastRev) {
      lastRev.completedAt = new Date().toISOString();
      lastRev.result      = dto.result;
    }
    if (dto.outputFileUrl) item.outputFileUrl = dto.outputFileUrl;
    item.status = SiteVisualizationStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 승인 */
  async approve(id: string, dto: ApproveVisualizationDto): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (item.status !== SiteVisualizationStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 승인 가능합니다.');
    }
    item.status     = SiteVisualizationStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    if (dto.notes) item.reviewNotes = dto.notes;
    return this.repo.save(item);
  }

  /** 최종 확정 */
  async finalize(id: string): Promise<SiteVisualization> {
    const item = await this.findOne(id);
    if (item.status !== SiteVisualizationStatus.APPROVED) {
      throw new BadRequestException('승인(approved) 상태만 최종 확정 가능합니다.');
    }
    item.status = SiteVisualizationStatus.FINAL;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([SiteVisualizationStatus.APPROVED, SiteVisualizationStatus.FINAL].includes(item.status)) {
      throw new BadRequestException('승인/최종 확정 상태는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
