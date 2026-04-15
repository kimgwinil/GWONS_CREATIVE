/**
 * GWONS_CREATIVE — PurchaseOrdersService
 * 조달팀: H/W 구매 발주 서비스
 * 상태: draft → submitted → confirmed → in_transit → delivered → inspected
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import {
  CreatePurchaseOrderDto, UpdatePurchaseOrderDto,
  InspectPurchaseOrderDto, ListPurchaseOrdersDto,
} from './dto/purchase-order.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly repo: Repository<PurchaseOrder>,
  ) {}

  async findAll(dto: ListPurchaseOrdersDto): Promise<PaginatedResponse<PurchaseOrder>> {
    const where: any = {};
    if (dto.projectId)  where.projectId  = dto.projectId;
    if (dto.status)     where.status     = dto.status;
    if (dto.vendorName) where.vendorName = dto.vendorName;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`발주서(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const item = this.repo.create({
      ...dto,
      lineItems: dto.lineItems ?? [],
      currency: dto.currency ?? 'KRW',
      totalAmount: this._calcTotal(dto.lineItems ?? []),
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if ([PurchaseOrderStatus.DELIVERED, PurchaseOrderStatus.INSPECTED,
         PurchaseOrderStatus.CANCELLED].includes(item.status)) {
      throw new BadRequestException('납품완료·검수완료·취소 상태는 수정 불가합니다.');
    }
    if (dto.lineItems) {
      item.totalAmount = this._calcTotal(dto.lineItems);
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 공급업체에 발주서 제출 */
  async submit(id: string): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('초안(draft) 상태만 제출 가능합니다.');
    }
    if (!item.lineItems?.length) {
      throw new BadRequestException('발주 항목(lineItems)이 최소 1개 이상 필요합니다.');
    }
    if (!item.vendorName) {
      throw new BadRequestException('공급업체(vendorName)를 지정해야 합니다.');
    }
    item.status      = PurchaseOrderStatus.SUBMITTED;
    item.submittedAt = new Date();
    return this.repo.save(item);
  }

  /** 공급업체 수주 확인 */
  async confirm(id: string, expectedDeliveryDate?: Date): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException('제출(submitted) 상태만 수주 확인 가능합니다.');
    }
    item.status      = PurchaseOrderStatus.CONFIRMED;
    item.confirmedAt = new Date();
    if (expectedDeliveryDate) item.expectedDeliveryDate = expectedDeliveryDate;
    return this.repo.save(item);
  }

  /** 제조·배송 시작 */
  async startTransit(id: string): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.CONFIRMED) {
      throw new BadRequestException('수주확인(confirmed) 상태만 배송 처리 가능합니다.');
    }
    item.status = PurchaseOrderStatus.IN_TRANSIT;
    return this.repo.save(item);
  }

  /** 납품 완료 */
  async deliver(id: string, actualDeliveryDate?: Date): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.IN_TRANSIT) {
      throw new BadRequestException('배송 중(in_transit) 상태만 납품 처리 가능합니다.');
    }
    item.status             = PurchaseOrderStatus.DELIVERED;
    item.actualDeliveryDate = actualDeliveryDate ?? new Date();
    return this.repo.save(item);
  }

  /** 검수 완료 */
  async inspect(id: string, dto: InspectPurchaseOrderDto): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.DELIVERED) {
      throw new BadRequestException('납품완료(delivered) 상태만 검수 가능합니다.');
    }
    item.status = PurchaseOrderStatus.INSPECTED;
    item.inspectionResult = {
      inspectedAt:    new Date().toISOString(),
      inspectedBy:    dto.inspectedBy,
      passedItems:    dto.passedItems,
      failedItems:    dto.failedItems,
      defectDetails:  dto.defectDetails,
      overallResult:  dto.overallResult,
    };
    return this.repo.save(item);
  }

  /** 취소 */
  async cancel(id: string, reason?: string): Promise<PurchaseOrder> {
    const item = await this.findOne(id);
    if ([PurchaseOrderStatus.DELIVERED, PurchaseOrderStatus.INSPECTED].includes(item.status)) {
      throw new BadRequestException('납품완료·검수완료 상태는 취소 불가합니다.');
    }
    item.status = PurchaseOrderStatus.CANCELLED;
    if (reason) item.specialConditions = `[취소 사유] ${reason}\n${item.specialConditions ?? ''}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('초안 상태만 삭제 가능합니다.');
    }
    await this.repo.remove(item);
  }

  private _calcTotal(lineItems: any[]): number {
    return lineItems.reduce((sum, li) => sum + (Number(li.totalPrice) || 0), 0);
  }
}
