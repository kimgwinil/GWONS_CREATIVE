import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ConstructionPlansService } from './construction-plans.service';
import {
  CreateConstructionPlanDto, UpdateConstructionPlanDto,
  UpdateTaskProgressDto, InspectConstructionDto,
  ListConstructionPlansDto,
} from './dto/construction-plan.dto';

@Controller('construction-plans')
export class ConstructionPlansController {
  constructor(private readonly svc: ConstructionPlansService) {}

  @Get()    findAll(@Query() q: ListConstructionPlansDto) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string)            { return this.svc.findOne(id); }
  @Post()   create(@Body() dto: CreateConstructionPlanDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateConstructionPlanDto) { return this.svc.update(id, dto); }
  @Post(':id/approve')   approve(@Param('id') id: string)  { return this.svc.approve(id); }
  @Post(':id/start')     start(@Param('id') id: string)    { return this.svc.start(id); }
  @Patch(':id/tasks/:taskId') updateTask(@Param('id') id: string, @Param('taskId') taskId: string, @Body() dto: UpdateTaskProgressDto) { return this.svc.updateTask(id, taskId, dto); }
  @Post(':id/suspend')   suspend(@Param('id') id: string, @Body('reason') reason: string) { return this.svc.suspend(id, reason); }
  @Post(':id/resume')    resume(@Param('id') id: string)   { return this.svc.resume(id); }
  @Post(':id/complete')  complete(@Param('id') id: string) { return this.svc.complete(id); }
  @Post(':id/inspect')   inspect(@Param('id') id: string, @Body() dto: InspectConstructionDto) { return this.svc.inspect(id, dto); }
  @Delete(':id') remove(@Param('id') id: string)           { return this.svc.remove(id); }
}
