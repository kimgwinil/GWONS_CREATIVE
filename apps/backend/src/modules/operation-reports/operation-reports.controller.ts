import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { OperationReportsService } from './operation-reports.service';
import {
  CreateOperationReportDto, UpdateOperationReportDto,
  PublishOperationReportDto, AcknowledgeOperationReportDto,
  ListOperationReportsDto,
} from './dto/operation-report.dto';

@Controller('operation-reports')
export class OperationReportsController {
  constructor(private readonly svc: OperationReportsService) {}

  @Get()
  findAll(@Query() dto: ListOperationReportsDto) { return this.svc.findAll(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateOperationReportDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOperationReportDto) { return this.svc.update(id, dto); }

  @Post(':id/submit')
  submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Body() dto: PublishOperationReportDto) { return this.svc.publish(id, dto); }

  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Body() dto: AcknowledgeOperationReportDto) { return this.svc.acknowledge(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
