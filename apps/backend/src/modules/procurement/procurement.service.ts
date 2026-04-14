import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcurementItem } from './entities/procurement-item.entity';
import { CreateProcurementItemDto, UpdateProcurementItemDto, ListProcurementDto } from './dto/procurement.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(ProcurementItem)
    private readonly procurementRepo: Repository<ProcurementItem>,
  ) {}

  /** 조달 목록 조회 — 인풋 기반 페이징 */
  async findAll(dto: ListProcurementDto): Promise<PaginatedResponse<ProcurementItem>> {
    const where: Partial<Record<keyof ProcurementItem, any>> = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.category)  where.category = dto.category;
    if (dto.status)    where.status = dto.status;

    return PaginationEngine.paginateWithCount(this.procurementRepo, dto, where);
  }

  async findOne(id: string): Promise<ProcurementItem> {
    const item = await this.procurementRepo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`조달 항목(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateProcurementItemDto): Promise<ProcurementItem> {
    const item = this.procurementRepo.create(dto);
    return this.procurementRepo.save(item);
  }

  async update(id: string, dto: UpdateProcurementItemDto): Promise<ProcurementItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.procurementRepo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.procurementRepo.remove(item);
  }
}
