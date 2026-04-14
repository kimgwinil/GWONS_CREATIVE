import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import {
  CreateScenarioDto, UpdateScenarioDto,
  ApproveScenarioDto, ListScenariosDto,
} from './dto/scenario.dto';

@Controller('api/v1/scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  /**
   * GET /api/v1/scenarios?cursor=&limit=20&projectId=&type=main&status=draft
   * 시나리오 목록 — 인풋 기반 페이징
   */
  @Get()
  findAll(@Query() q: ListScenariosDto) {
    return this.scenariosService.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scenariosService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateScenarioDto) {
    return this.scenariosService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateScenarioDto) {
    return this.scenariosService.update(id, body);
  }

  /** PATCH /api/v1/scenarios/:id/review — 검토 요청 */
  @Patch(':id/review')
  submitForReview(@Param('id') id: string) {
    return this.scenariosService.submitForReview(id);
  }

  /** PATCH /api/v1/scenarios/:id/approve — 승인 */
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveScenarioDto) {
    return this.scenariosService.approve(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.scenariosService.remove(id);
  }
}
