import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { RenderAssetsService } from './render-assets.service';
import { CreateRenderAssetDto, UpdateRenderAssetDto, ListRenderAssetsDto } from './dto/render-asset.dto';

@Controller('api/v1/render-assets')
export class RenderAssetsController {
  constructor(private readonly svc: RenderAssetsService) {}

  /** GET /api/v1/render-assets?cursor=&projectId=&assetType=render_img&viewType=interior */
  @Get()    findAll(@Query() q: ListRenderAssetsDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateRenderAssetDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateRenderAssetDto) { return this.svc.update(id, b); }

  /** PATCH /render-assets/:id/render — 렌더링 시작 */
  @Patch(':id/render')
  startRendering(@Param('id') id: string) { return this.svc.startRendering(id); }

  /** PATCH /render-assets/:id/review — 렌더 완료 + 검토 요청 */
  @Patch(':id/review')
  submitForReview(
    @Param('id') id: string,
    @Body() b: { outputFileUrl: string; thumbnailUrl?: string },
  ) { return this.svc.submitForReview(id, b.outputFileUrl, b.thumbnailUrl); }

  /** PATCH /render-assets/:id/approve */
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() b: { reviewNotes?: string }) {
    return this.svc.approve(id, b.reviewNotes);
  }

  /** PATCH /render-assets/:id/finalize — 최종본 */
  @Patch(':id/finalize')
  finalize(@Param('id') id: string) { return this.svc.finalize(id); }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
