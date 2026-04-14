import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayoutSketch, SketchStatus } from './entities/layout-sketch.entity';
import { CreateLayoutSketchDto, UpdateLayoutSketchDto, ListLayoutSketchesDto } from './dto/layout-sketch.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class LayoutSketchesService {
  constructor(
    @InjectRepository(LayoutSketch)
    private readonly sketchRepo: Repository<LayoutSketch>,
  ) {}

  async findAll(dto: ListLayoutSketchesDto): Promise<PaginatedResponse<LayoutSketch>> {
    const where: any = {};
    if (dto.projectId)   where.projectId   = dto.projectId;
    if (dto.sketchType)  where.sketchType  = dto.sketchType;
    if (dto.status)      where.status      = dto.status;
    if (dto.floorNumber) where.floorNumber = Number(dto.floorNumber);
    return PaginationEngine.paginateWithCount(this.sketchRepo, dto, where);
  }

  async findOne(id: string): Promise<LayoutSketch> {
    const sketch = await this.sketchRepo.findOne({ where: { id }, relations: ['project'] });
    if (!sketch) throw new NotFoundException(`레이아웃 스케치(${id})를 찾을 수 없습니다.`);
    return sketch;
  }

  async create(dto: CreateLayoutSketchDto): Promise<LayoutSketch> {
    const sketch = this.sketchRepo.create({
      ...dto,
      zones: dto.zones ?? [],
      version: 1,
    });
    return this.sketchRepo.save(sketch);
  }

  async update(id: string, dto: UpdateLayoutSketchDto): Promise<LayoutSketch> {
    const sketch = await this.findOne(id);
    if (dto.fileUrl || dto.zones) {
      sketch.version += 1; // 도면 변경 시 버전 증가
    }
    Object.assign(sketch, dto);
    return this.sketchRepo.save(sketch);
  }

  /** 기획팀에 공유 */
  async share(id: string): Promise<LayoutSketch> {
    const sketch = await this.findOne(id);
    if (sketch.status !== SketchStatus.DRAFT && sketch.status !== SketchStatus.REVISED) {
      throw new BadRequestException('초안(draft) 또는 수정(revised) 상태만 공유 가능합니다.');
    }
    sketch.status = SketchStatus.SHARED;
    return this.sketchRepo.save(sketch);
  }

  /** 기획팀 승인 */
  async approve(id: string): Promise<LayoutSketch> {
    const sketch = await this.findOne(id);
    if (sketch.status !== SketchStatus.SHARED) {
      throw new BadRequestException('공유(shared) 상태만 승인 가능합니다.');
    }
    sketch.status = SketchStatus.APPROVED;
    return this.sketchRepo.save(sketch);
  }

  /** 수정 요청 (기획팀 → 2D팀) */
  async requestRevision(id: string, notes: string): Promise<LayoutSketch> {
    const sketch = await this.findOne(id);
    sketch.status        = SketchStatus.REVISED;
    sketch.revisionNotes = notes;
    return this.sketchRepo.save(sketch);
  }

  async remove(id: string): Promise<void> {
    const sketch = await this.findOne(id);
    await this.sketchRepo.remove(sketch);
  }
}
