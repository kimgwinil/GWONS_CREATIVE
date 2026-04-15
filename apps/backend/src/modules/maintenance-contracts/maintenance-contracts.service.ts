/**
 * GWONS_CREATIVE — MaintenanceContractsService
 * 조달팀: 유지보수 계약 지원
 * drafting → negotiating → signed → active → expired/terminated
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceContract, ContractStatus, MaintenanceRecord } from './entities/maintenance-contract.entity';
import {
  CreateMaintenanceContractDto, UpdateMaintenanceContractDto,
  SignContractDto, AddMaintenanceRecordDto,
  ListMaintenanceContractsDto,
} from './dto/maintenance-contract.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MaintenanceContractsService {
  constructor(
    @InjectRepository(MaintenanceContract)
    private readonly repo: Repository<MaintenanceContract>,
  ) {}

  async findAll(dto: ListMaintenanceContractsDto): Promise<PaginatedResponse<MaintenanceContract>> {
    const where: any = {};
    if (dto.projectId)    where.projectId    = dto.projectId;
    if (dto.status)       where.status       = dto.status;
    if (dto.contractType) where.contractType = dto.contractType;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<MaintenanceContract> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`유지보수 계약(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateMaintenanceContractDto): Promise<MaintenanceContract> {
    const item = this.repo.create({
      ...dto,
      maintenanceScope:   dto.maintenanceScope ?? [],
      slaClauses:         dto.slaClauses ?? [],
      maintenanceRecords: [],
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateMaintenanceContractDto): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if ([ContractStatus.EXPIRED, ContractStatus.TERMINATED].includes(item.status)) {
      throw new BadRequestException('만료/해지된 계약은 수정 불가합니다.');
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 협상 시작 */
  async startNegotiation(id: string): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if (item.status !== ContractStatus.DRAFTING) {
      throw new BadRequestException('작성 중(drafting) 상태만 협상 착수 가능합니다.');
    }
    if (!item.maintenanceScope?.length) {
      throw new BadRequestException('유지보수 범위(maintenanceScope)가 최소 1개 이상 필요합니다.');
    }
    item.status = ContractStatus.NEGOTIATING;
    return this.repo.save(item);
  }

  /** 계약 체결 */
  async sign(id: string, dto: SignContractDto): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if (item.status !== ContractStatus.NEGOTIATING) {
      throw new BadRequestException('협상 중(negotiating) 상태만 계약 체결 가능합니다.');
    }
    if (!item.startDate || !item.endDate) {
      throw new BadRequestException('계약 시작일(startDate)과 종료일(endDate)을 설정해야 합니다.');
    }
    item.status          = ContractStatus.SIGNED;
    item.signedAt        = new Date();
    item.managedBy       = dto.signedBy;
    if (dto.contractFileUrl) item.contractFileUrl = dto.contractFileUrl;
    if (dto.notes) item.notes = dto.notes;
    return this.repo.save(item);
  }

  /** 유지보수 활성화 (계약 시작일 도래) */
  async activate(id: string): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if (item.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('계약 체결(signed) 상태만 활성화 가능합니다.');
    }
    item.status = ContractStatus.ACTIVE;
    return this.repo.save(item);
  }

  /** 유지보수 이력 추가 */
  async addRecord(id: string, dto: AddMaintenanceRecordDto): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if (item.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('활성(active) 상태에서만 유지보수 이력 추가 가능합니다.');
    }
    const record: MaintenanceRecord = {
      recordId:          uuidv4(),
      visitDate:         new Date().toISOString().split('T')[0],
      visitedBy:         dto.visitedBy,
      targetItems:       dto.targetItems,
      workType:          dto.workType,
      description:       dto.description,
      result:            dto.result,
      nextScheduledDate: dto.nextScheduledDate,
      cost:              dto.cost,
      notes:             dto.notes,
    };
    item.maintenanceRecords = [...item.maintenanceRecords, record];
    return this.repo.save(item);
  }

  /** 계약 만료 */
  async expire(id: string): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if (item.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('활성(active) 상태만 만료 처리 가능합니다.');
    }
    item.status = ContractStatus.EXPIRED;
    return this.repo.save(item);
  }

  /** 계약 해지 */
  async terminate(id: string, reason: string): Promise<MaintenanceContract> {
    const item = await this.findOne(id);
    if ([ContractStatus.EXPIRED, ContractStatus.TERMINATED].includes(item.status)) {
      throw new BadRequestException('이미 종료된 계약입니다.');
    }
    item.status = ContractStatus.TERMINATED;
    item.notes  = `[해지 사유] ${reason}\n${item.notes ?? ''}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([ContractStatus.SIGNED, ContractStatus.ACTIVE].includes(item.status)) {
      throw new BadRequestException('체결/활성 계약은 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
