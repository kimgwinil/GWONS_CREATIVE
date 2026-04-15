import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { IntegrationTestsService } from './integration-tests.service';
import {
  CreateIntegrationTestDto, UpdateIntegrationTestDto,
  RunSimulationDto, ApproveIntegrationTestDto,
  ListIntegrationTestsDto,
} from './dto/integration-test.dto';

@Controller('integration-tests')
export class IntegrationTestsController {
  constructor(private readonly svc: IntegrationTestsService) {}

  @Get()     findAll(@Query() q: ListIntegrationTestsDto)                                    { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string)                                               { return this.svc.findOne(id); }
  @Post()    create(@Body() dto: CreateIntegrationTestDto)                                   { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateIntegrationTestDto)      { return this.svc.update(id, dto); }
  @Post(':id/start-simulation') startSimulation(@Param('id') id: string)                    { return this.svc.startSimulation(id); }
  @Post(':id/run-simulation')   runSimulation(@Param('id') id: string, @Body() dto: RunSimulationDto) { return this.svc.runSimulation(id, dto); }
  @Post(':id/submit-for-review') submitForReview(@Param('id') id: string)                   { return this.svc.submitForReview(id); }
  @Post(':id/submit-to-client') submitToClient(@Param('id') id: string)                     { return this.svc.submitToClient(id); }
  @Post(':id/approve') approve(@Param('id') id: string, @Body() dto: ApproveIntegrationTestDto) { return this.svc.approve(id, dto); }
  @Post(':id/reject')  reject(@Param('id') id: string, @Body('feedback') feedback: string)  { return this.svc.reject(id, feedback); }
  @Delete(':id') remove(@Param('id') id: string)                                             { return this.svc.remove(id); }
}
