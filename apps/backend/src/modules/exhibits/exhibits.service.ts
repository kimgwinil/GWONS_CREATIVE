import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exhibit } from './entities/exhibit.entity';
import { CreateExhibitDto, UpdateExhibitDto, ListExhibitsDto } from './dto/exhibit.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ExhibitsService {
  constructor(
    @InjectRepository(Exhibit)
    private readonly exhibitRepo: Repository<Exhibit>,
  ) {}

  /** 전시 목록 조회 — 인풋 기반 페이징 */
  async findAll(dto: ListExhibitsDto): Promise<PaginatedResponse<Exhibit>> {
    const where: Partial<Record<keyof Exhibit, any>> = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status = dto.status;
    if (dto.category)  where.category = dto.category;

    return PaginationEngine.paginateWithCount(this.exhibitRepo, dto, where);
  }

  async findOne(id: string): Promise<Exhibit> {
    const exhibit = await this.exhibitRepo.findOne({ where: { id }, relations: ['project'] });
    if (!exhibit) throw new NotFoundException(`전시(${id})를 찾을 수 없습니다.`);
    return exhibit;
  }

  async create(dto: CreateExhibitDto): Promise<Exhibit> {
    const exhibit = this.exhibitRepo.create(dto);
    return this.exhibitRepo.save(exhibit);
  }

  async update(id: string, dto: UpdateExhibitDto): Promise<Exhibit> {
    const exhibit = await this.findOne(id);
    Object.assign(exhibit, dto);
    return this.exhibitRepo.save(exhibit);
  }

  async remove(id: string): Promise<void> {
    const exhibit = await this.findOne(id);
    await this.exhibitRepo.remove(exhibit);
  }
}
