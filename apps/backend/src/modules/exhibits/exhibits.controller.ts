import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ExhibitsService } from './exhibits.service';
import { CreateExhibitDto, UpdateExhibitDto, ListExhibitsDto } from './dto/exhibit.dto';

@Controller('api/v1/exhibits')
export class ExhibitsController {
  constructor(private readonly exhibitsService: ExhibitsService) {}

  /** GET /api/v1/exhibits?cursor=&limit=20&projectId=&status= */
  @Get()
  findAll(@Query() query: ListExhibitsDto) {
    return this.exhibitsService.findAll({ ...query, limit: query.limit ? Number(query.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exhibitsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateExhibitDto) {
    return this.exhibitsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateExhibitDto) {
    return this.exhibitsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.exhibitsService.remove(id);
  }
}
