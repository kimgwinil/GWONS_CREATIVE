/**
 * GWONS_CREATIVE — Projects Controller
 * REST API: /api/v1/projects
 */
import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ConfirmGateDto, ListProjectsDto } from './dto/project.dto';

@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /api/v1/projects
   * 프로젝트 목록 조회 — 인풋 기반 페이징
   * @query cursor    - 커서 토큰 (첫 요청 시 생략)
   * @query limit     - 페이지 크기 (기본: 20)
   * @query direction - 'next' | 'prev'
   * @query status    - 필터: 상태
   * @query phase     - 필터: 단계
   */
  @Get()
  findAll(@Query() query: ListProjectsDto) {
    return this.projectsService.findAll({
      ...query,
      limit: query.limit ? Number(query.limit) : 20,
      direction: query.direction ?? 'next',
    });
  }

  /**
   * GET /api/v1/projects/:id
   * 단일 프로젝트 조회
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  /**
   * POST /api/v1/projects
   * 프로젝트 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateProjectDto) {
    return this.projectsService.create(body);
  }

  /**
   * PUT /api/v1/projects/:id
   * 프로젝트 수정
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
    return this.projectsService.update(id, body);
  }

  /**
   * PATCH /api/v1/projects/:id/phases/:phase/confirm
   * 컨펌 게이트 처리
   */
  @Patch(':id/phases/:phase/confirm')
  confirmGate(
    @Param('id') id: string,
    @Param('phase') phase: string,
    @Body() body: ConfirmGateDto,
  ) {
    return this.projectsService.confirmGate(id, Number(phase), body);
  }

  /**
   * DELETE /api/v1/projects/:id
   * 프로젝트 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
