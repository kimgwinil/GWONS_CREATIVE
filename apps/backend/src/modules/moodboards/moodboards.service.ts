import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moodboard, MoodboardStatus } from './entities/moodboard.entity';
import { CreateMoodboardDto, UpdateMoodboardDto, ListMoodboardsDto } from './dto/moodboard.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class MoodboardsService {
  constructor(
    @InjectRepository(Moodboard)
    private readonly moodboardRepo: Repository<Moodboard>,
  ) {}

  async findAll(dto: ListMoodboardsDto): Promise<PaginatedResponse<Moodboard>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.mood)      where.mood      = dto.mood;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.moodboardRepo, dto, where);
  }

  async findOne(id: string): Promise<Moodboard> {
    const mb = await this.moodboardRepo.findOne({ where: { id }, relations: ['project'] });
    if (!mb) throw new NotFoundException(`무드보드(${id})를 찾을 수 없습니다.`);
    return mb;
  }

  async create(dto: CreateMoodboardDto): Promise<Moodboard> {
    const mb = this.moodboardRepo.create({
      ...dto,
      references: dto.references ?? [],
      colorPalette: dto.colorPalette ?? [],
      materialKeywords: dto.materialKeywords ?? [],
    });
    return this.moodboardRepo.save(mb);
  }

  async update(id: string, dto: UpdateMoodboardDto): Promise<Moodboard> {
    const mb = await this.findOne(id);
    Object.assign(mb, dto);
    return this.moodboardRepo.save(mb);
  }

  /** 팀 공유 처리 — 기획팀에 무드보드 공유 */
  async share(id: string): Promise<Moodboard> {
    const mb = await this.findOne(id);
    if (mb.status !== MoodboardStatus.DRAFT) {
      throw new BadRequestException('초안(draft) 상태만 공유 가능합니다.');
    }
    if (!mb.references || mb.references.length === 0) {
      throw new BadRequestException('레퍼런스 이미지가 최소 1개 이상 필요합니다.');
    }
    if (!mb.colorPalette || mb.colorPalette.length === 0) {
      throw new BadRequestException('컬러 팔레트가 최소 1개 이상 필요합니다.');
    }
    mb.status = MoodboardStatus.SHARED;
    return this.moodboardRepo.save(mb);
  }

  /** 기획팀 승인 처리 */
  async approve(id: string): Promise<Moodboard> {
    const mb = await this.findOne(id);
    if (mb.status !== MoodboardStatus.SHARED) {
      throw new BadRequestException('공유(shared) 상태만 승인 가능합니다.');
    }
    mb.status = MoodboardStatus.APPROVED;
    return this.moodboardRepo.save(mb);
  }

  async remove(id: string): Promise<void> {
    const mb = await this.findOne(id);
    await this.moodboardRepo.remove(mb);
  }
}
