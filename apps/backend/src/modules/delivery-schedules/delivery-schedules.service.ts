/**
 * GWONS_CREATIVE — DeliverySchedulesService
 * 납품 일정표 관리 — Phase 3 합류 모듈
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliverySchedule, DeliveryScheduleStatus } from './entities/delivery-schedule.entity';
import {
  CreateDeliveryScheduleDto, UpdateDeliveryScheduleDto,
  UpdateDeliveryEventDto, ListDeliverySchedulesDto,
} from './dto/delivery-schedule.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class DeliverySchedulesService {
  constructor(
    @InjectRepository(DeliverySchedule)
    private readonly repo: Repository<DeliverySchedule>,
  ) {}

  async findAll(dto: ListDeliverySchedulesDto): Promise<PaginatedResponse<DeliverySchedule>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<DeliverySchedule> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`납품 일정표(${id})를 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateDeliveryScheduleDto): Promise<DeliverySchedule> {
    const events = dto.deliveryEvents ?? [];
    const item = this.repo.create({
      ...dto,
      deliveryEvents:    events,
      installationLinks: dto.installationLinks ?? [],
      totalEvents:       events.length,
      completedEvents:   events.filter(e => e.status === 'delivered').length,
      delayedEvents:     events.filter(e => e.status === 'delayed').length,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateDeliveryScheduleDto): Promise<DeliverySchedule> {
    const item = await this.findOne(id);
    if (item.status === DeliveryScheduleStatus.COMPLETED) {
      throw new BadRequestException('완료된 납품 일정표는 수정 불가합니다.');
    }
    if (dto.deliveryEvents) {
      item.totalEvents     = dto.deliveryEvents.length;
      item.completedEvents = dto.deliveryEvents.filter(e => e.status === 'delivered').length;
      item.delayedEvents   = dto.deliveryEvents.filter(e => e.status === 'delayed').length;
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 납품 일정 확정 */
  async confirm(id: string): Promise<DeliverySchedule> {
    const item = await this.findOne(id);
    if (item.status !== DeliveryScheduleStatus.PLANNING) {
      throw new BadRequestException('계획 중(planning) 상태만 확정 가능합니다.');
    }
    if (!item.deliveryEvents?.length) {
      throw new BadRequestException('납품 이벤트가 최소 1개 이상 필요합니다.');
    }
    if (!item.targetCompletionDate) {
      throw new BadRequestException('전체 납품 완료 목표일(targetCompletionDate)을 설정해야 합니다.');
    }
    item.status = DeliveryScheduleStatus.CONFIRMED;
    return this.repo.save(item);
  }

  /** 납품 진행 시작 */
  async startProgress(id: string): Promise<DeliverySchedule> {
    const item = await this.findOne(id);
    if (item.status !== DeliveryScheduleStatus.CONFIRMED) {
      throw new BadRequestException('확정(confirmed) 상태만 진행 처리 가능합니다.');
    }
    item.status = DeliveryScheduleStatus.IN_PROGRESS;
    return this.repo.save(item);
  }

  /** 개별 납품 이벤트 상태 업데이트 */
  async updateEvent(id: string, eventId: string, dto: UpdateDeliveryEventDto): Promise<DeliverySchedule> {
    const item = await this.findOne(id);
    const event = item.deliveryEvents.find(e => e.eventId === eventId);
    if (!event) throw new BadRequestException(`납품 이벤트(${eventId})를 찾을 수 없습니다.`);

    event.status = dto.status;
    if (dto.actualDate)   event.actualDate   = dto.actualDate;
    if (dto.delayDays)    event.delayDays    = dto.delayDays;
    if (dto.delayReason)  event.delayReason  = dto.delayReason;
    if (dto.notes)        event.notes        = dto.notes;

    // 집계 재계산
    item.completedEvents = item.deliveryEvents.filter(e => e.status === 'delivered').length;
    item.delayedEvents   = item.deliveryEvents.filter(e => e.status === 'delayed').length;

    // 지연 이벤트가 있으면 DELAYED
    if (item.delayedEvents > 0 && item.status === DeliveryScheduleStatus.IN_PROGRESS) {
      item.status = DeliveryScheduleStatus.DELAYED;
    }
    // 모든 이벤트 완료 시 자동 완료
    const activEvents = item.deliveryEvents.filter(e => e.status !== 'cancelled');
    if (activEvents.length > 0 && activEvents.every(e => e.status === 'delivered')) {
      item.status               = DeliveryScheduleStatus.COMPLETED;
      item.actualCompletionDate = new Date();
    }
    return this.repo.save(item);
  }

  /** 전체 납품 완료 처리 */
  async complete(id: string): Promise<DeliverySchedule> {
    const item = await this.findOne(id);
    if (![DeliveryScheduleStatus.IN_PROGRESS, DeliveryScheduleStatus.DELAYED].includes(item.status)) {
      throw new BadRequestException('진행 중/지연 상태만 완료 처리 가능합니다.');
    }
    item.status               = DeliveryScheduleStatus.COMPLETED;
    item.actualCompletionDate = new Date();
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.status !== DeliveryScheduleStatus.PLANNING) {
      throw new BadRequestException('계획 중 상태만 삭제 가능합니다.');
    }
    await this.repo.remove(item);
  }
}
