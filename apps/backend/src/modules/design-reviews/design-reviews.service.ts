import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignReview, DesignReviewStatus } from './entities/design-review.entity';
import {
  CreateDesignReviewDto, UpdateDesignReviewDto,
  ApproveDesignReviewDto, ListDesignReviewsDto,
} from './dto/design-review.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class DesignReviewsService {
  constructor(
    @InjectRepository(DesignReview)
    private readonly repo: Repository<DesignReview>,
  ) {}

  async findAll(dto: ListDesignReviewsDto): Promise<PaginatedResponse<DesignReview>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<DesignReview> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`설계 검토서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateDesignReviewDto): Promise<DesignReview> {
    const item = this.repo.create({
      ...dto,
      deliverables: dto.deliverables ?? [
        { teamName: '기획팀',     deliverableType: 'basic_design',    deliverableId: dto.basicDesignId    ?? '', deliverableTitle: '기본설계서',   isCompleted: !!dto.basicDesignId },
        { teamName: '기획팀',     deliverableType: 'detail_design',   deliverableId: dto.detailDesignId   ?? '', deliverableTitle: '상세설계서',   isCompleted: !!dto.detailDesignId },
        { teamName: '3D디자인팀', deliverableType: 'render_asset',    deliverableId: dto.renderAssetId    ?? '', deliverableTitle: '3D 렌더링',    isCompleted: !!dto.renderAssetId },
        { teamName: '2D디자인팀', deliverableType: 'cad_drawing',     deliverableId: dto.cadDrawingId     ?? '', deliverableTitle: 'CAD 도면',     isCompleted: !!dto.cadDrawingId },
        { teamName: '조달팀',     deliverableType: 'market_research', deliverableId: dto.marketResearchId ?? '', deliverableTitle: '시장조사 결과', isCompleted: !!dto.marketResearchId },
      ],
      designIssues: [],
      version: 1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateDesignReviewDto): Promise<DesignReview> {
    const item = await this.findOne(id);
    if (item.status === DesignReviewStatus.APPROVED) {
      throw new BadRequestException('승인된 설계 검토서는 수정 불가합니다.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async submitForReview(id: string): Promise<DesignReview> {
    const item = await this.findOne(id);
    if (item.status !== DesignReviewStatus.COLLECTING) {
      throw new BadRequestException('수집 중(collecting) 상태만 검토 요청 가능합니다.');
    }
    const incomplete = item.deliverables.filter(d => !d.isCompleted);
    if (incomplete.length > 0) {
      throw new BadRequestException(
        `미완료 산출물: ${incomplete.map(d => d.deliverableTitle).join(', ')}`
      );
    }
    item.status = DesignReviewStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  async submitToClient(id: string): Promise<DesignReview> {
    const item = await this.findOne(id);
    if (item.status !== DesignReviewStatus.IN_REVIEW) {
      throw new BadRequestException('내부 검토(in_review) 상태만 클라이언트 제출 가능합니다.');
    }
    const openIssues = item.designIssues.filter(i => i.status === 'open' && i.severity === 'critical');
    if (openIssues.length > 0) {
      throw new BadRequestException(`Critical 이슈 ${openIssues.length}건이 미해결 상태입니다.`);
    }
    item.status = DesignReviewStatus.CLIENT_REVIEW;
    return this.repo.save(item);
  }

  /** 컨펌 게이트 #2 — 클라이언트 최종 승인 → Phase 3 조달 착수 */
  async approve(id: string, dto: ApproveDesignReviewDto): Promise<DesignReview> {
    const item = await this.findOne(id);
    if (item.status !== DesignReviewStatus.CLIENT_REVIEW) {
      throw new BadRequestException('클라이언트 검토(client_review) 상태만 승인 가능합니다.');
    }
    item.status     = DesignReviewStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    if (dto.clientFeedback) item.clientFeedback = dto.clientFeedback;
    return this.repo.save(item);
  }

  async reject(id: string, feedback: string): Promise<DesignReview> {
    const item = await this.findOne(id);
    item.status        = DesignReviewStatus.REJECTED;
    item.clientFeedback = feedback;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
