import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SiteVisualizationsService } from './site-visualizations.service';
import {
  CreateSiteVisualizationDto, UpdateSiteVisualizationDto,
  RequestRevisionDto, CompleteRevisionDto,
  ApproveVisualizationDto, ListSiteVisualizationsDto,
} from './dto/site-visualization.dto';

@Controller('site-visualizations')
export class SiteVisualizationsController {
  constructor(private readonly svc: SiteVisualizationsService) {}

  @Get()     findAll(@Query() q: ListSiteVisualizationsDto)                            { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string)                                         { return this.svc.findOne(id); }
  @Post()    create(@Body() dto: CreateSiteVisualizationDto)                           { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSiteVisualizationDto) { return this.svc.update(id, dto); }
  @Post(':id/submit-for-review') submitForReview(@Param('id') id: string)              { return this.svc.submitForReview(id); }
  @Post(':id/request-revision') requestRevision(@Param('id') id: string, @Body() dto: RequestRevisionDto) { return this.svc.requestRevision(id, dto); }
  @Post(':id/complete-revision') completeRevision(@Param('id') id: string, @Body() dto: CompleteRevisionDto) { return this.svc.completeRevision(id, dto); }
  @Post(':id/approve')  approve(@Param('id') id: string, @Body() dto: ApproveVisualizationDto) { return this.svc.approve(id, dto); }
  @Post(':id/finalize') finalize(@Param('id') id: string)                              { return this.svc.finalize(id); }
  @Delete(':id') remove(@Param('id') id: string)                                       { return this.svc.remove(id); }
}
