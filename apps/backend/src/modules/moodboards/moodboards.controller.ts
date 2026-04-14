import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MoodboardsService } from './moodboards.service';
import { CreateMoodboardDto, UpdateMoodboardDto, ListMoodboardsDto } from './dto/moodboard.dto';

@Controller('api/v1/moodboards')
export class MoodboardsController {
  constructor(private readonly moodboardsService: MoodboardsService) {}

  /** GET /api/v1/moodboards?cursor=&projectId=&mood=&status= */
  @Get()
  findAll(@Query() q: ListMoodboardsDto) {
    return this.moodboardsService.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moodboardsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateMoodboardDto) {
    return this.moodboardsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateMoodboardDto) {
    return this.moodboardsService.update(id, body);
  }

  /** PATCH /api/v1/moodboards/:id/share — 기획팀에 공유 */
  @Patch(':id/share')
  share(@Param('id') id: string) {
    return this.moodboardsService.share(id);
  }

  /** PATCH /api/v1/moodboards/:id/approve — 기획팀 승인 */
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.moodboardsService.approve(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.moodboardsService.remove(id);
  }
}
