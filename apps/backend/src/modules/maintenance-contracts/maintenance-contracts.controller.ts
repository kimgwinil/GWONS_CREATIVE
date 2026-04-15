import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MaintenanceContractsService } from './maintenance-contracts.service';
import {
  CreateMaintenanceContractDto, UpdateMaintenanceContractDto,
  SignContractDto, AddMaintenanceRecordDto,
  ListMaintenanceContractsDto,
} from './dto/maintenance-contract.dto';

@Controller('maintenance-contracts')
export class MaintenanceContractsController {
  constructor(private readonly svc: MaintenanceContractsService) {}

  @Get()
  findAll(@Query() dto: ListMaintenanceContractsDto) { return this.svc.findAll(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateMaintenanceContractDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceContractDto) { return this.svc.update(id, dto); }

  @Post(':id/negotiate')
  startNegotiation(@Param('id') id: string) { return this.svc.startNegotiation(id); }

  @Post(':id/sign')
  sign(@Param('id') id: string, @Body() dto: SignContractDto) { return this.svc.sign(id, dto); }

  @Post(':id/activate')
  activate(@Param('id') id: string) { return this.svc.activate(id); }

  @Post(':id/records')
  addRecord(@Param('id') id: string, @Body() dto: AddMaintenanceRecordDto) { return this.svc.addRecord(id, dto); }

  @Post(':id/expire')
  expire(@Param('id') id: string) { return this.svc.expire(id); }

  @Post(':id/terminate')
  terminate(@Param('id') id: string, @Body() body: { reason: string }) { return this.svc.terminate(id, body.reason); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
