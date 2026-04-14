import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { BasicDesignsService } from './basic-designs.service';
import { CreateBasicDesignDto, UpdateBasicDesignDto, ListBasicDesignsDto } from './dto/basic-design.dto';

@Controller('api/v1/basic-designs')
export class BasicDesignsController {
  constructor(private readonly svc: BasicDesignsService) {}

  @Get()
  findAll(@Query() q: ListBasicDesignsDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post()        @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateBasicDesignDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateBasicDesignDto) { return this.svc.update(id, b); }
  @Patch(':id/review')     submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }
  @Patch(':id/approve')    approve(@Param('id') id: string)         { return this.svc.approve(id); }
  /** PATCH /api/v1/basic-designs/:id/distribute — 각 팀 설계 배포 (Phase 2 병렬 착수 트리거) */
  @Patch(':id/distribute') distribute(@Param('id') id: string)      { return this.svc.distribute(id); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
