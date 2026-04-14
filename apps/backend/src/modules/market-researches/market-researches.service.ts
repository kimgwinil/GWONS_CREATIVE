import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketResearch, ResearchStatus } from './entities/market-research.entity';
import { CreateMarketResearchDto, UpdateMarketResearchDto, ListMarketResearchesDto } from './dto/market-research.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class MarketResearchesService {
  constructor(
    @InjectRepository(MarketResearch)
    private readonly repo: Repository<MarketResearch>,
  ) {}

  async findAll(dto: ListMarketResearchesDto): Promise<PaginatedResponse<MarketResearch>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.category)  where.category  = dto.category;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<MarketResearch> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`시장조사(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateMarketResearchDto): Promise<MarketResearch> {
    const item = this.repo.create({
      ...dto,
      vendorQuotes: dto.vendorQuotes ?? [],
      techSpecs: dto.techSpecs ?? [],
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateMarketResearchDto): Promise<MarketResearch> {
    const item = await this.findOne(id);
    if (item.status === ResearchStatus.APPROVED) {
      throw new BadRequestException('승인된 시장조사는 수정 불가합니다.');
    }
    // 가격 범위 자동 계산 (vendorQuotes 갱신 시)
    if (dto.vendorQuotes?.length) {
      const prices = dto.vendorQuotes.map(q => q.totalPrice).filter(p => p > 0);
      if (prices.length) {
        dto.estimatedMinPrice = Math.min(...prices);
        dto.estimatedMaxPrice = Math.max(...prices);
      }
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 조사 완료 처리 */
  async complete(id: string): Promise<MarketResearch> {
    const item = await this.findOne(id);
    if (item.status !== ResearchStatus.OPEN) {
      throw new BadRequestException('조사 중(open) 상태만 완료 처리 가능합니다.');
    }
    if (!item.vendorQuotes?.length) {
      throw new BadRequestException('최소 1개 이상의 공급처 견적(vendorQuotes)이 필요합니다.');
    }
    if (!item.recommendedVendor) {
      throw new BadRequestException('추천 공급처(recommendedVendor)를 지정해야 합니다.');
    }
    item.status = ResearchStatus.COMPLETED;
    return this.repo.save(item);
  }

  /** 기획팀 검토 완료 */
  async review(id: string): Promise<MarketResearch> {
    const item = await this.findOne(id);
    if (item.status !== ResearchStatus.COMPLETED) {
      throw new BadRequestException('완료(completed) 상태만 검토 가능합니다.');
    }
    item.status = ResearchStatus.REVIEWED;
    return this.repo.save(item);
  }

  /** 조달 목록 반영 승인 */
  async approve(id: string): Promise<MarketResearch> {
    const item = await this.findOne(id);
    if (item.status !== ResearchStatus.REVIEWED) {
      throw new BadRequestException('검토(reviewed) 상태만 승인 가능합니다.');
    }
    item.status = ResearchStatus.APPROVED;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
