import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicDesign, BasicDesignStatus } from './entities/basic-design.entity';
import { CreateBasicDesignDto, UpdateBasicDesignDto, ListBasicDesignsDto } from './dto/basic-design.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class BasicDesignsService {
  constructor(
    @InjectRepository(BasicDesign)
    private readonly repo: Repository<BasicDesign>,
  ) {}

  async findAll(dto: ListBasicDesignsDto): Promise<PaginatedResponse<BasicDesign>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<BasicDesign> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`기본설계서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateBasicDesignDto): Promise<BasicDesign> {
    const item = this.repo.create({
      ...dto,
      designCriteria: dto.designCriteria ?? [],
      spacePrograms: dto.spacePrograms ?? [],
      systemRequirements: dto.systemRequirements ?? [],
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateBasicDesignDto): Promise<BasicDesign> {
    const item = await this.findOne(id);
    if (item.status === BasicDesignStatus.DISTRIBUTED) {
      throw new BadRequestException('배포된 기본설계서는 수정 불가합니다. 신규 버전을 생성하세요.');
    }
    item.version += 1;
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async submitForReview(id: string): Promise<BasicDesign> {
    const item = await this.findOne(id);
    if (item.status !== BasicDesignStatus.DRAFT) {
      throw new BadRequestException('초안 상태만 검토 요청 가능합니다.');
    }
    if (!item.spacePrograms?.length) {
      throw new BadRequestException('공간 프로그램(spacePrograms)이 최소 1개 필요합니다.');
    }
    item.status = BasicDesignStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  async approve(id: string): Promise<BasicDesign> {
    const item = await this.findOne(id);
    if (item.status !== BasicDesignStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중 상태만 승인 가능합니다.');
    }
    item.status = BasicDesignStatus.APPROVED;
    return this.repo.save(item);
  }

  /** 각 팀에 설계 가이드 배포 → Phase 2 병렬 시작 트리거 */
  async distribute(id: string): Promise<BasicDesign> {
    const item = await this.findOne(id);
    if (item.status !== BasicDesignStatus.APPROVED) {
      throw new BadRequestException('승인된 기본설계서만 배포 가능합니다.');
    }
    item.status        = BasicDesignStatus.DISTRIBUTED;
    item.distributedAt = new Date();
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
