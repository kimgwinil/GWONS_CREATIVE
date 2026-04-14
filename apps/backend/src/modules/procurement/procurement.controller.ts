import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { CreateProcurementItemDto, UpdateProcurementItemDto, ListProcurementDto } from './dto/procurement.dto';
import { ProcurementStatus } from './entities/procurement-item.entity';

@Controller('api/v1/procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  /**
   * GET /api/v1/procurement?cursor=&limit=50&category=hardware&status=researching
   * 조달 목록 — 인풋 기반 페이징
   */
  @Get()
  findAll(@Query() query: ListProcurementDto) {
    return this.procurementService.findAll({ ...query, limit: query.limit ? Number(query.limit) : 20 });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.procurementService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateProcurementItemDto) {
    return this.procurementService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateProcurementItemDto) {
    return this.procurementService.update(id, body);
  }

  /**
   * PATCH /api/v1/procurement/:id/status
   * 조달 상태 변경 (시장조사→검토→승인→발주→납품중→납품완료)
   */
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ProcurementStatus },
  ) {
    return this.procurementService.update(id, { status: body.status });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.procurementService.remove(id);
  }
}
