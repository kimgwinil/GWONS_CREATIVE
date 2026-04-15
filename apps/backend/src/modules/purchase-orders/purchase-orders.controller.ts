/**
 * GWONS_CREATIVE — PurchaseOrdersController
 */
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto, UpdatePurchaseOrderDto,
  InspectPurchaseOrderDto, ListPurchaseOrdersDto,
} from './dto/purchase-order.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Get()
  findAll(@Query() q: ListPurchaseOrdersDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string) { return this.svc.submit(id); }

  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body('expectedDeliveryDate') date?: string,
  ) { return this.svc.confirm(id, date ? new Date(date) : undefined); }

  @Post(':id/start-transit')
  startTransit(@Param('id') id: string) { return this.svc.startTransit(id); }

  @Post(':id/deliver')
  deliver(
    @Param('id') id: string,
    @Body('actualDeliveryDate') date?: string,
  ) { return this.svc.deliver(id, date ? new Date(date) : undefined); }

  @Post(':id/inspect')
  inspect(@Param('id') id: string, @Body() dto: InspectPurchaseOrderDto) {
    return this.svc.inspect(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.svc.cancel(id, reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
