import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { LayoutSketchesService } from './layout-sketches.service';
import { CreateLayoutSketchDto, UpdateLayoutSketchDto, ListLayoutSketchesDto } from './dto/layout-sketch.dto';

@Controller('api/v1/layout-sketches')
export class LayoutSketchesController {
  constructor(private readonly layoutSketchesService: LayoutSketchesService) {}

  /** GET /api/v1/layout-sketches?cursor=&projectId=&sketchType=floor_plan */
  @Get()
  findAll(@Query() q: ListLayoutSketchesDto) {
    return this.layoutSketchesService.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.layoutSketchesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateLayoutSketchDto) {
    return this.layoutSketchesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateLayoutSketchDto) {
    return this.layoutSketchesService.update(id, body);
  }

  /** PATCH /api/v1/layout-sketches/:id/share */
  @Patch(':id/share')
  share(@Param('id') id: string) {
    return this.layoutSketchesService.share(id);
  }

  /** PATCH /api/v1/layout-sketches/:id/approve */
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.layoutSketchesService.approve(id);
  }

  /** PATCH /api/v1/layout-sketches/:id/revision — 수정 요청 */
  @Patch(':id/revision')
  requestRevision(@Param('id') id: string, @Body() body: { notes: string }) {
    return this.layoutSketchesService.requestRevision(id, body.notes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.layoutSketchesService.remove(id);
  }
}
