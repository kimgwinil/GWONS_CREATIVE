import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { OperationGuidesService } from './operation-guides.service';
import {
  CreateOperationGuideDto, UpdateOperationGuideDto,
  ApproveOperationGuideDto, DeliverOperationGuideDto,
  ListOperationGuidesDto,
} from './dto/operation-guide.dto';

@Controller('operation-guides')
export class OperationGuidesController {
  constructor(private readonly svc: OperationGuidesService) {}

  @Get()
  findAll(@Query() dto: ListOperationGuidesDto) { return this.svc.findAll(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateOperationGuideDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOperationGuideDto) { return this.svc.update(id, dto); }

  @Post(':id/submit')
  submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveOperationGuideDto) { return this.svc.approve(id, dto); }

  @Post(':id/deliver')
  deliver(@Param('id') id: string, @Body() dto: DeliverOperationGuideDto) { return this.svc.deliver(id, dto); }

  @Post(':id/revise')
  revise(@Param('id') id: string) { return this.svc.revise(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
