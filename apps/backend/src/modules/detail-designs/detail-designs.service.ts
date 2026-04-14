import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetailDesign, DetailDesignStatus } from './entities/detail-design.entity';
import {
  CreateDetailDesignDto, UpdateDetailDesignDto,
  ApproveDetailDesignDto, ListDetailDesignsDto,
} from './dto/detail-design.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class DetailDesignsService {
  constructor(
    @InjectRepository(DetailDesign)
    private readonly repo: Repository<DetailDesign>,
  ) {}

  async findAll(dto: ListDetailDesignsDto): Promise<PaginatedResponse<DetailDesign>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<DetailDesign> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`상세설계서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateDetailDesignDto): Promise<DetailDesign> {
    const item = this.repo.create({
      ...dto,
      finishSpecs: dto.finishSpecs ?? [],
      equipmentSpecs: dto.equipmentSpecs ?? [],
      contentSpecs: dto.contentSpecs ?? [],
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateDetailDesignDto): Promise<DetailDesign> {
    const item = await this.findOne(id);
    if ([DetailDesignStatus.APPROVED, DetailDesignStatus.FINAL].includes(item.status)) {
      throw new BadRequestException('승인/확정 상태는 수정 불가합니다.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async submitForReview(id: string): Promise<DetailDesign> {
    const item = await this.findOne(id);
    if (item.status !== DetailDesignStatus.DRAFT) {
      throw new BadRequestException('초안 상태만 검토 요청 가능합니다.');
    }
    item.status = DetailDesignStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  async approve(id: string, dto: ApproveDetailDesignDto): Promise<DetailDesign> {
    const item = await this.findOne(id);
    if (item.status !== DetailDesignStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중 상태만 승인 가능합니다.');
    }
    item.status     = DetailDesignStatus.APPROVED;
    item.approvedBy = dto.approvedBy;
    item.approvedAt = new Date();
    return this.repo.save(item);
  }

  async finalize(id: string): Promise<DetailDesign> {
    const item = await this.findOne(id);
    if (item.status !== DetailDesignStatus.APPROVED) {
      throw new BadRequestException('승인 상태만 확정 가능합니다.');
    }
    item.status = DetailDesignStatus.FINAL;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
