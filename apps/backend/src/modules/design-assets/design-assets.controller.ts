import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DesignAssetsService } from './design-assets.service';
import { CreateDesignAssetDto, UpdateDesignAssetDto, ListDesignAssetsDto } from './dto/design-asset.dto';

@Controller('api/v1/design-assets')
export class DesignAssetsController {
  constructor(private readonly designAssetsService: DesignAssetsService) {}

  /**
   * GET /api/v1/design-assets?cursor=&limit=10&teamType=3d&projectId=
   * 3D/2D 에셋 목록 — 인풋 기반 페이징
   */
  @Get()
  findAll(@Query() query: ListDesignAssetsDto) {
    return this.designAssetsService.findAll({ ...query, limit: query.limit ? Number(query.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designAssetsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateDesignAssetDto) {
    return this.designAssetsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateDesignAssetDto) {
    return this.designAssetsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.designAssetsService.remove(id);
  }
}
