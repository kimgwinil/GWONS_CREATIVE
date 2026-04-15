/**
 * GWONS_CREATIVE — OperationReportsService
 * 기획팀: 종합 운영 현황 리포트 (Phase 5 합류 지점)
 * drafting → in_review → published → acknowledged
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationReport, ReportStatus } from './entities/operation-report.entity';
import {
  CreateOperationReportDto, UpdateOperationReportDto,
  PublishOperationReportDto, AcknowledgeOperationReportDto,
  ListOperationReportsDto,
} from './dto/operation-report.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class OperationReportsService {
  constructor(
    @InjectRepository(OperationReport)
    private readonly repo: Repository<OperationReport>,
  ) {}

  async findAll(dto: ListOperationReportsDto): Promise<PaginatedResponse<OperationReport>> {
    const where: any = {};
    if (dto.projectId)    where.projectId    = dto.projectId;
    if (dto.status)       where.status       = dto.status;
    if (dto.reportPeriod) where.reportPeriod = dto.reportPeriod;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<OperationReport> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`운영 리포트(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateOperationReportDto): Promise<OperationReport> {
    const item = this.repo.create({
      ...dto,
      metrics:              dto.metrics ?? [],
      deliverableSummaries: dto.deliverableSummaries ?? [],
      issues:               dto.issues ?? [],
      nextPeriodPlans:      dto.nextPeriodPlans ?? [],
      version:              1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateOperationReportDto): Promise<OperationReport> {
    const item = await this.findOne(id);
    if ([ReportStatus.PUBLISHED, ReportStatus.ACKNOWLEDGED].includes(item.status)) {
      throw new BadRequestException('발행/확인 완료 상태의 리포트는 수정 불가합니다.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 내부 검토 요청 */
  async submitForReview(id: string): Promise<OperationReport> {
    const item = await this.findOne(id);
    if (item.status !== ReportStatus.DRAFTING) {
      throw new BadRequestException('작성 중(drafting) 상태만 검토 요청 가능합니다.');
    }
    if (!item.metrics?.length) {
      throw new BadRequestException('운영 지표(metrics)가 최소 1개 이상 필요합니다.');
    }
    item.status = ReportStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  /** 리포트 발행 */
  async publish(id: string, dto: PublishOperationReportDto): Promise<OperationReport> {
    const item = await this.findOne(id);
    if (item.status !== ReportStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중(in_review) 상태만 발행 가능합니다.');
    }
    // 미해결 critical 이슈 경고 (차단하지는 않되 체크)
    const openCriticals = item.issues.filter(i => i.severity === 'critical' && i.status === 'open');
    if (openCriticals.length > 0) {
      // 발행은 허용하되 notes에 기록
      item.internalNotes = `[경고] Critical 미해결 이슈 ${openCriticals.length}건 포함\n${item.internalNotes ?? ''}`;
    }
    item.status      = ReportStatus.PUBLISHED;
    item.publishedBy = dto.publishedBy;
    item.publishedAt = new Date();
    if (dto.notes) item.internalNotes = `${dto.notes}\n${item.internalNotes ?? ''}`;
    return this.repo.save(item);
  }

  /** 클라이언트 확인 */
  async acknowledge(id: string, dto: AcknowledgeOperationReportDto): Promise<OperationReport> {
    const item = await this.findOne(id);
    if (item.status !== ReportStatus.PUBLISHED) {
      throw new BadRequestException('발행(published) 상태만 클라이언트 확인 가능합니다.');
    }
    item.status          = ReportStatus.ACKNOWLEDGED;
    item.acknowledgedBy  = dto.acknowledgedBy;
    item.acknowledgedAt  = new Date();
    if (dto.clientFeedback) item.clientFeedback = dto.clientFeedback;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([ReportStatus.PUBLISHED, ReportStatus.ACKNOWLEDGED].includes(item.status)) {
      throw new BadRequestException('발행/확인 완료 리포트는 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
