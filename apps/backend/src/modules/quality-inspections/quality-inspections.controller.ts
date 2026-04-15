import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { QualityInspectionsService } from './quality-inspections.service';
import {
  CreateQualityInspectionDto, UpdateQualityInspectionDto,
  CompleteInspectionDto, ResolveDefectDto,
  ListQualityInspectionsDto,
} from './dto/quality-inspection.dto';

@Controller('quality-inspections')
export class QualityInspectionsController {
  constructor(private readonly svc: QualityInspectionsService) {}

  @Get()     findAll(@Query() q: ListQualityInspectionsDto)                                  { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string)                                               { return this.svc.findOne(id); }
  @Post()    create(@Body() dto: CreateQualityInspectionDto)                                 { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateQualityInspectionDto)    { return this.svc.update(id, dto); }
  @Post(':id/start')   startInspection(@Param('id') id: string)                             { return this.svc.startInspection(id); }
  @Post(':id/complete') completeInspection(@Param('id') id: string, @Body() dto: CompleteInspectionDto) { return this.svc.completeInspection(id, dto); }
  @Post(':id/defects/:defectId/resolve') resolveDefect(@Param('id') id: string, @Param('defectId') defectId: string, @Body() dto: ResolveDefectDto) { return this.svc.resolveDefect(id, defectId, dto); }
  @Post(':id/re-inspect') markReInspected(@Param('id') id: string, @Body('inspector') inspector: string) { return this.svc.markReInspected(id, inspector); }
  @Delete(':id') remove(@Param('id') id: string)                                             { return this.svc.remove(id); }
}
