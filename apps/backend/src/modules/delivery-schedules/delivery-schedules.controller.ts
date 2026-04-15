import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { DeliverySchedulesService } from './delivery-schedules.service';
import {
  CreateDeliveryScheduleDto, UpdateDeliveryScheduleDto,
  UpdateDeliveryEventDto, ListDeliverySchedulesDto,
} from './dto/delivery-schedule.dto';

@Controller('delivery-schedules')
export class DeliverySchedulesController {
  constructor(private readonly svc: DeliverySchedulesService) {}

  @Get()
  findAll(@Query() q: ListDeliverySchedulesDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateDeliveryScheduleDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryScheduleDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) { return this.svc.confirm(id); }

  @Post(':id/start-progress')
  startProgress(@Param('id') id: string) { return this.svc.startProgress(id); }

  @Patch(':id/events/:eventId')
  updateEvent(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateDeliveryEventDto,
  ) { return this.svc.updateEvent(id, eventId, dto); }

  @Post(':id/complete')
  complete(@Param('id') id: string) { return this.svc.complete(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
