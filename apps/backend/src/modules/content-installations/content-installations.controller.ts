import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ContentInstallationsService } from './content-installations.service';
import {
  CreateContentInstallationDto, UpdateContentInstallationDto,
  UpdateInstallationItemDto, AddIntegrationTestDto,
  ListContentInstallationsDto,
} from './dto/content-installation.dto';

@Controller('content-installations')
export class ContentInstallationsController {
  constructor(private readonly svc: ContentInstallationsService) {}

  @Get()     findAll(@Query() q: ListContentInstallationsDto)                               { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string)                                              { return this.svc.findOne(id); }
  @Post()    create(@Body() dto: CreateContentInstallationDto)                              { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateContentInstallationDto) { return this.svc.update(id, dto); }
  @Post(':id/start')  startInstallation(@Param('id') id: string)                           { return this.svc.startInstallation(id); }
  @Patch(':id/items/:itemId') updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateInstallationItemDto) { return this.svc.updateItem(id, itemId, dto); }
  @Post(':id/integration-tests') addIntegrationTest(@Param('id') id: string, @Body() dto: AddIntegrationTestDto) { return this.svc.addIntegrationTest(id, dto); }
  @Post(':id/complete') complete(@Param('id') id: string)                                   { return this.svc.complete(id); }
  @Delete(':id') remove(@Param('id') id: string)                                            { return this.svc.remove(id); }
}
