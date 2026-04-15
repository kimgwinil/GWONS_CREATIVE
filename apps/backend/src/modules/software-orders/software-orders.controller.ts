/**
 * GWONS_CREATIVE — SoftwareOrdersController
 */
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SoftwareOrdersService } from './software-orders.service';
import {
  CreateSoftwareOrderDto, UpdateSoftwareOrderDto,
  TestSoftwareOrderDto, ListSoftwareOrdersDto,
} from './dto/software-order.dto';

@Controller('software-orders')
export class SoftwareOrdersController {
  constructor(private readonly svc: SoftwareOrdersService) {}

  @Get()
  findAll(@Query() q: ListSoftwareOrdersDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateSoftwareOrderDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSoftwareOrderDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string) { return this.svc.submit(id); }

  @Post(':id/contract')
  contract(
    @Param('id') id: string,
    @Body('contractAmount') amount: number,
    @Body('contractFileUrl') url?: string,
  ) { return this.svc.contract(id, amount, url); }

  @Post(':id/start-development')
  startDevelopment(@Param('id') id: string) { return this.svc.startDevelopment(id); }

  @Post(':id/start-testing')
  startTesting(
    @Param('id') id: string,
    @Body('deliverableFileUrl') url?: string,
  ) { return this.svc.startTesting(id, url); }

  @Post(':id/deliver')
  deliver(@Param('id') id: string, @Body() dto: TestSoftwareOrderDto) {
    return this.svc.deliver(id, dto);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string) { return this.svc.accept(id); }

  @Patch(':id/milestones/:no')
  updateMilestone(
    @Param('id') id: string,
    @Param('no') no: string,
    @Body('status') status: 'pending' | 'in_progress' | 'completed' | 'delayed',
    @Body('actualDate') actualDate?: string,
  ) { return this.svc.updateMilestone(id, Number(no), status, actualDate); }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.svc.cancel(id, reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
