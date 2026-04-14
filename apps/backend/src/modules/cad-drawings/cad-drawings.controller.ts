import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CadDrawingsService } from './cad-drawings.service';
import { CreateCadDrawingDto, UpdateCadDrawingDto, IssueDrawingDto, ListCadDrawingsDto } from './dto/cad-drawing.dto';

@Controller('api/v1/cad-drawings')
export class CadDrawingsController {
  constructor(private readonly svc: CadDrawingsService) {}

  /** GET /api/v1/cad-drawings?cursor=&projectId=&discipline=architectural&drawingType=plan */
  @Get()    findAll(@Query() q: ListCadDrawingsDto) {
    return this.svc.findAll({ ...q, limit: q.limit ? Number(q.limit) : 20 });
  }
  @Get(':id')    findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() b: CreateCadDrawingDto) { return this.svc.create(b); }
  @Put(':id')    update(@Param('id') id: string, @Body() b: UpdateCadDrawingDto) { return this.svc.update(id, b); }
  @Patch(':id/review')   submitForReview(@Param('id') id: string) { return this.svc.submitForReview(id); }
  @Patch(':id/approve')  approve(@Param('id') id: string, @Body() b: { approvedBy: string }) { return this.svc.approve(id, b.approvedBy); }
  /** PATCH /cad-drawings/:id/issue — 시공용 발행 */
  @Patch(':id/issue')    issue(@Param('id') id: string, @Body() b: IssueDrawingDto) { return this.svc.issue(id, b); }
  @Patch(':id/revision') requestRevision(@Param('id') id: string, @Body() b: { reason: string }) { return this.svc.requestRevision(id, b.reason); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
