import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationReport } from './entities/operation-report.entity';
import { OperationReportsController } from './operation-reports.controller';
import { OperationReportsService } from './operation-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperationReport])],
  controllers: [OperationReportsController],
  providers: [OperationReportsService],
  exports: [OperationReportsService],
})
export class OperationReportsModule {}
