/**
 * GWONS_CREATIVE — Projects Service
 * 인풋 기반 페이징으로 프로젝트 목록 조회
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectPhase, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto, ConfirmGateDto, ListProjectsDto } from './dto/project.dto';
import { PaginationEngine } from '../../core/pagination/pagination.engine';
import { PaginatedResponse } from '../../core/pagination/pagination.types';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  /** 프로젝트 목록 조회 — 인풋 기반 페이징 */
  async findAll(dto: ListProjectsDto): Promise<PaginatedResponse<Project>> {
    const where: Partial<Record<keyof Project, any>> = {};
    if (dto.status) where.status = dto.status;
    if (dto.phase !== undefined) where.phase = dto.phase;

    return PaginationEngine.paginateWithCount(this.projectRepo, dto, where);
  }

  /** 단일 프로젝트 조회 */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['exhibits', 'designAssets', 'procurementItems'],
    });
    if (!project) throw new NotFoundException(`프로젝트(${id})를 찾을 수 없습니다.`);
    return project;
  }

  /** 프로젝트 생성 */
  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      ...dto,
      phase: ProjectPhase.KICKOFF,
      status: ProjectStatus.DRAFT,
      confirmGates: {},
    });
    return this.projectRepo.save(project);
  }

  /** 프로젝트 수정 */
  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  /** 컨펌 게이트 처리 (Phase 완료 컨펌) */
  async confirmGate(id: string, phase: number, dto: ConfirmGateDto): Promise<Project> {
    const project = await this.findOne(id);

    if (phase !== project.phase) {
      throw new BadRequestException(
        `현재 Phase(${project.phase})와 컨펌하려는 Phase(${phase})가 일치하지 않습니다.`
      );
    }

    // 컨펌 게이트 기록
    project.confirmGates = {
      ...project.confirmGates,
      [`gate_${phase}`]: {
        confirmedAt: new Date().toISOString(),
        confirmedBy: dto.confirmedBy,
      },
    };

    // 다음 Phase로 진입
    if (phase < ProjectPhase.OPERATION) {
      project.phase = (phase + 1) as ProjectPhase;
    }
    if (project.phase === ProjectPhase.OPERATION) {
      project.status = ProjectStatus.ACTIVE;
    }

    return this.projectRepo.save(project);
  }

  /** 프로젝트 삭제 */
  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepo.remove(project);
  }
}
