import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConceptPlansService } from './concept-plans.service';
import {
  CreateConceptPlanDto, UpdateConceptPlanDto,
  ApproveConceptPlanDto, ListConceptPlansDto,
} from './dto/concept-plan.dto';

@Controller('api/v1/concept-plans')
export class ConceptPlansController {
  constructor(private readonly conceptPlansService: ConceptPlansService) {}

  /** GET /api/v1/concept-plans?cursor=&limit=20&projectId=&theme=&status= */
  @Get()
  findAll(@Query() q: ListConceptPlansDto) {
    return this.conceptPlansService.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conceptPlansService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateConceptPlanDto) {
    return this.conceptPlansService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateConceptPlanDto) {
    return this.conceptPlansService.update(id, body);
  }

  /** PATCH /api/v1/concept-plans/:id/review */
  @Patch(':id/review')
  submitForReview(@Param('id') id: string) {
    return this.conceptPlansService.submitForReview(id);
  }

  /** PATCH /api/v1/concept-plans/:id/approve */
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveConceptPlanDto) {
    return this.conceptPlansService.approve(id, body);
  }

  /** PATCH /api/v1/concept-plans/:id/finalize — 최종 확정 */
  @Patch(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.conceptPlansService.finalize(id);
  }

  /** PATCH /api/v1/concept-plans/:id/reject */
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reviewNotes: string }) {
    return this.conceptPlansService.reject(id, body.reviewNotes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.conceptPlansService.remove(id);
  }
}
