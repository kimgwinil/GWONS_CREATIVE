import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceContract } from './entities/maintenance-contract.entity';
import { MaintenanceContractsController } from './maintenance-contracts.controller';
import { MaintenanceContractsService } from './maintenance-contracts.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceContract])],
  controllers: [MaintenanceContractsController],
  providers: [MaintenanceContractsService],
  exports: [MaintenanceContractsService],
})
export class MaintenanceContractsModule {}
