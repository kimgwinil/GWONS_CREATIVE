import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProcurementReviewsService } from './procurement-reviews.service';
import {
  CreateProcurementReviewDto, UpdateProcurementReviewDto,
  ApproveProcurementReviewDto, ListProcurementReviewsDto,
} from './dto/procurement-review.dto';

@Controller('procurement-reviews')
export class ProcurementReviewsController {
  constructor(private readonly svc: ProcurementReviewsService) {}

  @Get()
  findAll(@Query() q: ListProcurementReviewsDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateProcurementReviewDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProcurementReviewDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/submit-for-review')
  submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }

  @Post(':id/budget-check')
  proceedToBudgetCheck(@Param('id') id: string) { return this.svc.proceedToBudgetCheck(id); }

  @Post(':id/submit-to-client')
  submitToClient(@Param('id') id: string) { return this.svc.submitToClient(id); }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveProcurementReviewDto) {
    return this.svc.approve(id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('feedback') feedback: string) {
    return this.svc.reject(id, feedback);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
