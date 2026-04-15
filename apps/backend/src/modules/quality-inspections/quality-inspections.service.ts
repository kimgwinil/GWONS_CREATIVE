/**
 * GWONS_CREATIVE — QualityInspectionsService
 * 기획팀: 품질 점검 관리
 * Phase 4 병렬 — 기획팀 품질 트랙
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QualityInspection, InspectionStatus, InspectionCategory,
  ChecklistItem, DefectRecord,
} from './entities/quality-inspection.entity';
import {
  CreateQualityInspectionDto, UpdateQualityInspectionDto,
  CompleteInspectionDto, ResolveDefectDto,
  ListQualityInspectionsDto,
} from './dto/quality-inspection.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QualityInspectionsService {
  constructor(
    @InjectRepository(QualityInspection)
    private readonly repo: Repository<QualityInspection>,
  ) {}

  async findAll(dto: ListQualityInspectionsDto): Promise<PaginatedResponse<QualityInspection>> {
    const where: any = {};
    if (dto.projectId) where.projectId = dto.projectId;
    if (dto.status)    where.status    = dto.status;
    if (dto.category)  where.category  = dto.category;
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<QualityInspection> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`품질 점검(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateQualityInspectionDto): Promise<QualityInspection> {
    const items = dto.checklistItems ?? [];
    const item = this.repo.create({
      ...dto,
      checklistItems: items,
      defects:   [],
      totalItems: items.length,
      passedItems: items.filter(i => i.result === 'pass').length,
      failedItems: items.filter(i => i.result === 'fail').length,
      inspectionRound: 1,
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateQualityInspectionDto): Promise<QualityInspection> {
    const item = await this.findOne(id);
    if ([InspectionStatus.COMPLETED, InspectionStatus.RE_INSPECTED].includes(item.status)) {
      throw new BadRequestException('완료/재검수 완료 상태는 수정 불가합니다.');
    }
    if (dto.checklistItems) {
      item.totalItems  = dto.checklistItems.length;
      item.passedItems = dto.checklistItems.filter(i => i.result === 'pass').length;
      item.failedItems = dto.checklistItems.filter(i => i.result === 'fail').length;
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** 점검 착수 */
  async startInspection(id: string): Promise<QualityInspection> {
    const item = await this.findOne(id);
    if (item.status !== InspectionStatus.SCHEDULED) {
      throw new BadRequestException('예정(scheduled) 상태만 점검 착수 가능합니다.');
    }
    item.status    = InspectionStatus.IN_PROGRESS;
    item.startedAt = new Date();
    return this.repo.save(item);
  }

  /** 점검 완료 */
  async completeInspection(id: string, dto: CompleteInspectionDto): Promise<QualityInspection> {
    const item = await this.findOne(id);
    if (item.status !== InspectionStatus.IN_PROGRESS) {
      throw new BadRequestException('진행 중(in_progress) 상태만 완료 처리 가능합니다.');
    }
    // 미검수 항목 체크
    const pendingItems = item.checklistItems.filter(i => i.result === 'pending');
    if (pendingItems.length > 0) {
      throw new BadRequestException(`미검수 항목이 ${pendingItems.length}개 있습니다.`);
    }
    // 불합격 항목 → 결함 목록 자동 생성
    const failedItems = item.checklistItems.filter(i => i.result === 'fail');
    if (failedItems.length > 0) {
      item.defects = failedItems.map((fi) => ({
        defectId:       uuidv4(),
        checklistItemId: fi.itemId,
        severity:       fi.defectSeverity ?? 'minor',
        category:       fi.category,
        zone:           fi.zone,
        description:    fi.inspectorNote ?? fi.checkPoint,
        assignedTo:     '시공팀',
        dueDate:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status:         'open',
      }));
    }
    // 최종 집계
    item.passedItems   = item.checklistItems.filter(i => i.result === 'pass').length;
    item.failedItems   = failedItems.length;
    item.status        = dto.finalResult === 'fail'
      ? InspectionStatus.FAILED
      : InspectionStatus.COMPLETED;
    item.finalResult   = dto.finalResult;
    item.inspector     = dto.inspector;
    item.overallComment = dto.overallComment ?? item.overallComment;
    item.completedAt   = new Date();
    return this.repo.save(item);
  }

  /** 결함 해결 */
  async resolveDefect(id: string, defectId: string, dto: ResolveDefectDto): Promise<QualityInspection> {
    const item = await this.findOne(id);
    const defect = item.defects.find(d => d.defectId === defectId);
    if (!defect) throw new BadRequestException(`결함(${defectId})을 찾을 수 없습니다.`);
    defect.status     = 'resolved';
    defect.resolution = dto.resolution;
    defect.resolvedAt = new Date().toISOString();
    return this.repo.save(item);
  }

  /** 재검수 완료 */
  async markReInspected(id: string, inspector: string): Promise<QualityInspection> {
    const item = await this.findOne(id);
    if (item.status !== InspectionStatus.FAILED) {
      throw new BadRequestException('불합격(failed) 상태만 재검수 완료 처리 가능합니다.');
    }
    const openDefects = item.defects.filter(d => d.status === 'open' || d.status === 'in_progress');
    if (openDefects.length > 0) {
      throw new BadRequestException(`미해결 결함 ${openDefects.length}건이 있습니다.`);
    }
    item.status          = InspectionStatus.RE_INSPECTED;
    item.inspector       = inspector;
    item.inspectionRound += 1;
    item.completedAt     = new Date();
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if ([InspectionStatus.COMPLETED, InspectionStatus.RE_INSPECTED].includes(item.status)) {
      throw new BadRequestException('완료된 점검은 삭제 불가합니다.');
    }
    await this.repo.remove(item);
  }
}
