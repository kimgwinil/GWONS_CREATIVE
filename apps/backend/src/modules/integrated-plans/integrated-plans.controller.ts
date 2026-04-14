import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { IntegratedPlansService } from './integrated-plans.service';
import {
  CreateIntegratedPlanDto, UpdateIntegratedPlanDto,
  ApproveIntegratedPlanDto, ListIntegratedPlansDto,
} from './dto/integrated-plan.dto';

@Controller('api/v1/integrated-plans')
export class IntegratedPlansController {
  constructor(private readonly integratedPlansService: IntegratedPlansService) {}

  /** GET /api/v1/integrated-plans?cursor=&projectId=&status= */
  @Get()
  findAll(@Query() q: ListIntegratedPlansDto) {
    return this.integratedPlansService.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.integratedPlansService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateIntegratedPlanDto) {
    return this.integratedPlansService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateIntegratedPlanDto) {
    return this.integratedPlansService.update(id, body);
  }

  /** PATCH /api/v1/integrated-plans/:id/review — 내부 검토 요청 */
  @Patch(':id/review')
  submitForReview(@Param('id') id: string) {
    return this.integratedPlansService.submitForReview(id);
  }

  /** PATCH /api/v1/integrated-plans/:id/client-review — 클라이언트 제출 */
  @Patch(':id/client-review')
  submitToClient(@Param('id') id: string) {
    return this.integratedPlansService.submitToClient(id);
  }

  /** PATCH /api/v1/integrated-plans/:id/approve — 클라이언트 최종 승인 (컨펌 게이트 #1) */
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveIntegratedPlanDto) {
    return this.integratedPlansService.approve(id, body);
  }

  /** PATCH /api/v1/integrated-plans/:id/reject */
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { feedback: string }) {
    return this.integratedPlansService.reject(id, body.feedback);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.integratedPlansService.remove(id);
  }
}
