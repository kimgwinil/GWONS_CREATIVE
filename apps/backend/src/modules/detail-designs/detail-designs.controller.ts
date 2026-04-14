import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DetailDesignsService } from './detail-designs.service';
import {
  CreateDetailDesignDto, UpdateDetailDesignDto,
  ApproveDetailDesignDto, ListDetailDesignsDto,
} from './dto/detail-design.dto';

@Controller('api/v1/detail-designs')
export class DetailDesignsController {
  constructor(private readonly svc: DetailDesignsService) {}

  @Get()    findAll(@Query() q: ListDetailDesignsDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateDetailDesignDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateDetailDesignDto) { return this.svc.update(id, b); }
  @Patch(':id/review')   submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }
  @Patch(':id/approve')  approve(@Param('id') id: string, @Body() b: ApproveDetailDesignDto) { return this.svc.approve(id, b); }
  @Patch(':id/finalize') finalize(@Param('id') id: string) { return this.svc.finalize(id); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
