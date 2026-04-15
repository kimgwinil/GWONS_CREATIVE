/**
 * GWONS_CREATIVE — SoftwareOrdersService
 * 조달팀: S/W 라이선스 구매 + 커스텀 콘텐츠 개발 의뢰
 * draft → submitted → contracted → in_progress → testing → delivered → accepted
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoftwareOrder, SoftwareOrderStatus, SoftwareOrderType } from './entities/software-order.entity';
import {
  CreateSoftwareOrderDto, UpdateSoftwareOrderDto,
  TestSoftwareOrderDto, ListSoftwareOrdersDto,
} from './dto/software-order.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class SoftwareOrdersService {
  constructor(
    @InjectRepository(SoftwareOrder)
    private readonly repo: Repository<SoftwareOrder>,
  ) {}

  async findAll(dto: ListSoftwareOrdersDto): Promise<PaginatedResponse<SoftwareOrder>> {
    const where: any = {};
    if (dto.projectId)  where.projectId  = dto.projectId;
    if (dto.status)     where.status     = dto.status;
    if (dto.orderType)  where.orderType  = dto.orderType;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<SoftwareOrder> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`S/W 발주서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateSoftwareOrderDto): Promise<SoftwareOrder> {
    const item = this.repo.create({
      ...dto,
      techRequirements: dto.techRequirements ?? [],
      milestones:       dto.milestones ?? [],
      currency:         dto.currency ?? 'KRW',
      isCustomDevelopment: dto.isCustomDevelopment ?? (dto.orderType === SoftwareOrderType.CUSTOM_DEV || dto.orderType === SoftwareOrderType.CONTENT),
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateSoftwareOrderDto): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if ([SoftwareOrderStatus.ACCEPTED, SoftwareOrderStatus.CANCELLED].includes(item.status)) {
      throw new BadRequestException('수락완료·취소 상태는 수정 불가합니다.');
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 개발사/공급사 제출 */
  async submit(id: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.DRAFT) {
      throw new BadRequestException('초안(draft) 상태만 제출 가능합니다.');
    }
    if (!item.vendorName) throw new BadRequestException('공급/개발사(vendorName)를 지정해야 합니다.');
    item.status      = SoftwareOrderStatus.SUBMITTED;
    item.submittedAt = new Date();
    return this.repo.save(item);
  }

  /** 계약 체결 */
  async contract(id: string, contractAmount: number, contractFileUrl?: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.SUBMITTED) {
      throw new BadRequestException('제출(submitted) 상태만 계약 처리 가능합니다.');
    }
    if (contractAmount <= 0) throw new BadRequestException('계약 금액은 0보다 커야 합니다.');
    item.status         = SoftwareOrderStatus.CONTRACTED;
    item.contractAmount = contractAmount;
    item.contractedAt   = new Date();
    if (contractFileUrl) item.contractFileUrl = contractFileUrl;
    return this.repo.save(item);
  }

  /** 개발·제작 시작 */
  async startDevelopment(id: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.CONTRACTED) {
      throw new BadRequestException('계약완료(contracted) 상태만 개발 시작 가능합니다.');
    }
    item.status = SoftwareOrderStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 테스트/검수 요청 */
  async startTesting(id: string, deliverableFileUrl?: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('개발 중(in_progress) 상태만 테스트 요청 가능합니다.');
    }
    item.status = SoftwareOrderStatus.TESTING;
    if (deliverableFileUrl) item.deliverableFileUrl = deliverableFileUrl;
    return this.repo.save(item);
  }

  /** 테스트 완료 → 납품 */
  async deliver(id: string, dto: TestSoftwareOrderDto): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.TESTING) {
      throw new BadRequestException('테스트 중(testing) 상태만 납품 처리 가능합니다.');
    }
    item.testResult = {
      testedAt:       new Date().toISOString(),
      testedBy:       dto.testedBy,
      totalTestCases: dto.totalTestCases,
      passedCases:    dto.passedCases,
      failedCases:    dto.failedCases,
      issues:         dto.issues ?? [],
      overallResult:  dto.overallResult,
    };
    if (dto.overallResult === 'fail') {
      // 실패 시 개발 중으로 복귀
      item.status = SoftwareOrderStatus.IN_PROGRESS;
    } else {
      item.status             = SoftwareOrderStatus.DELIVERED;
      item.actualDeliveryDate = new Date();
    }
    return this.repo.save(item);
  }

  /** 최종 수락 (납품물 확인 완료) */
  async accept(id: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.DELIVERED) {
      throw new BadRequestException('납품완료(delivered) 상태만 수락 가능합니다.');
    }
    item.status = SoftwareOrderStatus.ACCEPTED;
    return this.repo.save(item);
  }

  /** 마일스톤 업데이트 */
  async updateMilestone(
    id: string,
    milestoneNo: number,
    status: 'pending' | 'in_progress' | 'completed' | 'delayed',
    actualDate?: string,
  ): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    const ms = item.milestones.find(m => m.milestoneNo === milestoneNo);
    if (!ms) throw new BadRequestException(`마일스톤 #${milestoneNo}을 찾을 수 없습니다.`);
    ms.status = status;
    if (actualDate) ms.actualDate = actualDate;
    return this.repo.save(item);
  }

  /** 취소 */
  async cancel(id: string, reason?: string): Promise<SoftwareOrder> {
    const item = await this.findOne(id);
    if ([SoftwareOrderStatus.ACCEPTED].includes(item.status)) {
      throw new BadRequestException('수락완료 상태는 취소 불가합니다.');
    }
    item.status = SoftwareOrderStatus.CANCELLED;
    if (reason) item.notes = `[취소 사유] ${reason}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.status !== SoftwareOrderStatus.DRAFT) {
      throw new BadRequestException('초안 상태만 삭제 가능합니다.');
    }
    await this.repo.remove(item);
  }
}
