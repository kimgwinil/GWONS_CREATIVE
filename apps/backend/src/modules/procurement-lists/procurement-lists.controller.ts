/**
 * GWONS_CREATIVE — ProcurementListsController
 */
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProcurementListsService } from './procurement-lists.service';
import {
  CreateProcurementListDto, UpdateProcurementListDto,
  ApproveProcurementListDto, ListProcurementListsDto,
} from './dto/procurement-list.dto';

@Controller('procurement-lists')
export class ProcurementListsController {
  constructor(private readonly svc: ProcurementListsService) {}

  @Get()
  findAll(@Query() q: ListProcurementListsDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateProcurementListDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProcurementListDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/submit-for-review')
  submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveProcurementListDto) {
    return this.svc.approve(id, dto);
  }

  @Post(':id/lock')
  lock(@Param('id') id: string) { return this.svc.lock(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
