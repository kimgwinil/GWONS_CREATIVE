import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DesignReviewsService } from './design-reviews.service';
import {
  CreateDesignReviewDto, UpdateDesignReviewDto,
  ApproveDesignReviewDto, ListDesignReviewsDto,
} from './dto/design-review.dto';

@Controller('api/v1/design-reviews')
export class DesignReviewsController {
  constructor(private readonly svc: DesignReviewsService) {}

  @Get()    findAll(@Query() q: ListDesignReviewsDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateDesignReviewDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateDesignReviewDto) { return this.svc.update(id, b); }
  /** PATCH /design-reviews/:id/review — 내부 검토 요청 */
  @Patch(':id/review')        submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }
  /** PATCH /design-reviews/:id/client-review — 클라이언트 제출 */
  @Patch(':id/client-review') submitToClient(@Param('id') id: string)  { return this.svc.submitToClient(id); }
  /** PATCH /design-reviews/:id/approve — 컨펌 게이트 #2 승인 */
  @Patch(':id/approve')       approve(@Param('id') id: string, @Body() b: ApproveDesignReviewDto) { return this.svc.approve(id, b); }
  @Patch(':id/reject')        reject(@Param('id') id: string, @Body() b: { feedback: string }) { return this.svc.reject(id, b.feedback); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
