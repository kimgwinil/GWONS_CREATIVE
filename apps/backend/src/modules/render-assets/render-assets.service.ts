import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RenderAsset, RenderAssetStatus } from './entities/render-asset.entity';
import { CreateRenderAssetDto, UpdateRenderAssetDto, ListRenderAssetsDto } from './dto/render-asset.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class RenderAssetsService {
  constructor(
    @InjectRepository(RenderAsset)
    private readonly repo: Repository<RenderAsset>,
  ) {}

  async findAll(dto: ListRenderAssetsDto): Promise<PaginatedResponse<RenderAsset>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.assetType) where.assetType = dto.assetType;
    if (dto.viewType)  where.viewType  = dto.viewType;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<RenderAsset> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`렌더 에셋(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateRenderAssetDto): Promise<RenderAsset> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateRenderAssetDto): Promise<RenderAsset> {
    const item = await this.findOne(id);
    if (dto.outputFileUrl || dto.sourceFileUrl) item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 렌더링 시작 */
  async startRendering(id: string): Promise<RenderAsset> {
    const item = await this.findOne(id);
    if (item.status !== RenderAssetStatus.MODELING) {
      throw new BadRequestException('모델링(modeling) 상태만 렌더링 시작 가능합니다.');
    }
    item.status = RenderAssetStatus.RENDERING;
    return this.repo.save(item);
  }

  /** 렌더링 완료 → 검토 요청 */
  async submitForReview(id: string, outputFileUrl: string, thumbnailUrl?: string): Promise<RenderAsset> {
    const item = await this.findOne(id);
    if (item.status !== RenderAssetStatus.RENDERING) {
      throw new BadRequestException('렌더링(rendering) 상태만 검토 요청 가능합니다.');
    }
    item.status        = RenderAssetStatus.REVIEW;
    item.outputFileUrl = outputFileUrl;
    if (thumbnailUrl) item.thumbnailUrl = thumbnailUrl;
    return this.repo.save(item);
  }

  /** 기획팀 승인 */
  async approve(id: string, reviewNotes?: string): Promise<RenderAsset> {
    const item = await this.findOne(id);
    if (item.status !== RenderAssetStatus.REVIEW) {
      throw new BadRequestException('검토(review) 상태만 승인 가능합니다.');
    }
    item.status      = RenderAssetStatus.APPROVED;
    if (reviewNotes) item.reviewNotes = reviewNotes;
    return this.repo.save(item);
  }

  /** 최종본 확정 */
  async finalize(id: string): Promise<RenderAsset> {
    const item = await this.findOne(id);
    if (item.status !== RenderAssetStatus.APPROVED) {
      throw new BadRequestException('승인 상태만 최종 확정 가능합니다.');
    }
    item.status = RenderAssetStatus.FINAL;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
