import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MarketResearchesService } from './market-researches.service';
import { CreateMarketResearchDto, UpdateMarketResearchDto, ListMarketResearchesDto } from './dto/market-research.dto';

@Controller('api/v1/market-researches')
export class MarketResearchesController {
  constructor(private readonly svc: MarketResearchesService) {}

  /** GET /api/v1/market-researches?cursor=&projectId=&category=display&status=open */
  @Get()    findAll(@Query() q: ListMarketResearchesDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateMarketResearchDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateMarketResearchDto) { return this.svc.update(id, b); }
  /** PATCH /market-researches/:id/complete — 조사 완료 */
  @Patch(':id/complete') complete(@Param('id') id: string) { return this.svc.complete(id); }
  /** PATCH /market-researches/:id/review — 기획팀 검토 */
  @Patch(':id/review')   review(@Param('id') id: string)   { return this.svc.review(id); }
  /** PATCH /market-researches/:id/approve — 조달 반영 승인 */
  @Patch(':id/approve')  approve(@Param('id') id: string)  { return this.svc.approve(id); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
