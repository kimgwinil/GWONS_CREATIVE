import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CadDrawing, DrawingStatus } from './entities/cad-drawing.entity';
import { CreateCadDrawingDto, UpdateCadDrawingDto, IssueDrawingDto, ListCadDrawingsDto } from './dto/cad-drawing.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class CadDrawingsService {
  constructor(
    @InjectRepository(CadDrawing)
    private readonly repo: Repository<CadDrawing>,
  ) {}

  async findAll(dto: ListCadDrawingsDto): Promise<PaginatedResponse<CadDrawing>> {
    const where: any = {};
    if (dto.projectId)   where.projectId   = dto.projectId;
    if (dto.discipline)  where.discipline  = dto.discipline;
    if (dto.drawingType) where.drawingType = dto.drawingType;
    if (dto.status)      where.status      = dto.status;
    if (dto.floorNumber) where.floorNumber = Number(dto.floorNumber);
    return PaginationEngine.paginateWithCount(this.repo, dto, where);
  }

  async findOne(id: string): Promise<CadDrawing> {
    const item = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!item) throw new NotFoundException(`CAD 도면(${id})을 찾을 수 없습니다.`);
    return item;
  }

  async create(dto: CreateCadDrawingDto): Promise<CadDrawing> {
    const item = this.repo.create({
      ...dto,
      revisionHistory: [{ revisionNo: 'A', date: new Date().toISOString(), description: '초안 작성', revisedBy: dto.drawnBy ?? 'system' }],
      layers: dto.layers ?? [],
      currentRevision: 'A',
    });
    return this.repo.save(item);
  }

  async update(id: string, dto: UpdateCadDrawingDto): Promise<CadDrawing> {
    const item = await this.findOne(id);
    if (item.status === DrawingStatus.ISSUED) {
      throw new BadRequestException('발행된 도면은 수정 불가합니다. 개정 처리를 이용하세요.');
    }
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async submitForReview(id: string): Promise<CadDrawing> {
    const item = await this.findOne(id);
    if (![DrawingStatus.DRAFT, DrawingStatus.REVISED].includes(item.status)) {
      throw new BadRequestException('초안/수정 상태만 검토 요청 가능합니다.');
    }
    if (!item.fileUrl) throw new BadRequestException('도면 파일(fileUrl)을 먼저 업로드해야 합니다.');
    item.status = DrawingStatus.IN_REVIEW;
    return this.repo.save(item);
  }

  async approve(id: string, approvedBy: string): Promise<CadDrawing> {
    const item = await this.findOne(id);
    if (item.status !== DrawingStatus.IN_REVIEW) {
      throw new BadRequestException('검토 중 상태만 승인 가능합니다.');
    }
    item.status     = DrawingStatus.APPROVED;
    item.approvedBy = approvedBy;
    item.approvedAt = new Date();
    return this.repo.save(item);
  }

  /** 시공용 도면 발행 + 개정 이력 기록 */
  async issue(id: string, dto: IssueDrawingDto): Promise<CadDrawing> {
    const item = await this.findOne(id);
    if (item.status !== DrawingStatus.APPROVED) {
      throw new BadRequestException('승인된 도면만 발행 가능합니다.');
    }
    // 개정 번호 자동 증가 (A→B→C 또는 0→1→2)
    const nextRev = String.fromCharCode(item.currentRevision.charCodeAt(0) + 1);
    item.revisionHistory.push({
      revisionNo: nextRev,
      date: new Date().toISOString(),
      description: dto.revisionDescription,
      revisedBy: item.drawnBy ?? 'system',
      checkedBy: dto.approvedBy,
    });
    item.currentRevision = nextRev;
    item.status          = DrawingStatus.ISSUED;
    item.issuedAt        = new Date();
    return this.repo.save(item);
  }

  /** 수정 요청 → REVISED 상태 */
  async requestRevision(id: string, reason: string): Promise<CadDrawing> {
    const item = await this.findOne(id);
    item.status      = DrawingStatus.REVISED;
    item.description = (item.description ?? '') + `\n[수정 요청] ${reason}`;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
