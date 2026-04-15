import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ContentUpdatesService } from './content-updates.service';
import {
  CreateContentUpdateDto, UpdateContentUpdateDto,
  ReviewContentUpdateDto, DeployContentUpdateDto,
  UpdateItemStatusDto, ListContentUpdatesDto,
} from './dto/content-update.dto';

@Controller('content-updates')
export class ContentUpdatesController {
  constructor(private readonly svc: ContentUpdatesService) {}

  @Get()
  findAll(@Query() dto: ListContentUpdatesDto) { return this.svc.findAll(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateContentUpdateDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContentUpdateDto) { return this.svc.update(id, dto); }

  @Post(':id/start')
  startWork(@Param('id') id: string) { return this.svc.startWork(id); }

  @Patch(':id/items/:itemId')
  updateItemStatus(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateItemStatusDto) {
    return this.svc.updateItemStatus(id, itemId, dto);
  }

  @Post(':id/submit')
  submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }

  @Post(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewContentUpdateDto) { return this.svc.review(id, dto); }

  @Post(':id/deploy')
  deploy(@Param('id') id: string, @Body() dto: DeployContentUpdateDto) { return this.svc.deploy(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
