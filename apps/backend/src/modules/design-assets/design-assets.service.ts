import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignAsset } from './entities/design-asset.entity';
import { CreateDesignAssetDto, UpdateDesignAssetDto, ListDesignAssetsDto } from './dto/design-asset.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class DesignAssetsService {
  constructor(
    @InjectRepository(DesignAsset)
    private readonly assetRepo: Repository<DesignAsset>,
  ) {}

  /** 디자인 에셋 목록 조회 — 인풋 기반 페이징 */
  async findAll(dto: ListDesignAssetsDto): Promise<PaginatedResponse<DesignAsset>> {
    const where: Partial<Record<keyof DesignAsset, any>> = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.teamType)  where.teamType = dto.teamType;
    if (dto.assetType) where.assetType = dto.assetType;
    if (dto.status)    where.status = dto.status;

    return PaginationEngine.paginateWithCount(this.assetRepo, dto, where);
  }

  async findOne(id: string): Promise<DesignAsset> {
    const asset = await this.assetRepo.findOne({ where: { id }, relations: ['project'] });
    if (!asset) throw new NotFoundException(`디자인 에셋(${id})을 찾을 수 없습니다.`);
    return asset;
  }

  async create(dto: CreateDesignAssetDto): Promise<DesignAsset> {
    const asset = this.assetRepo.create(dto);
    return this.assetRepo.save(asset);
  }

  async update(id: string, dto: UpdateDesignAssetDto): Promise<DesignAsset> {
    const asset = await this.findOne(id);
    // 버전 업
    if (dto.status) asset.version += 1;
    Object.assign(asset, dto);
    return this.assetRepo.save(asset);
  }

  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepo.remove(asset);
  }
}
