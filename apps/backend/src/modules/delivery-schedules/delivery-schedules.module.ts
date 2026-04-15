import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverySchedule } from './entities/delivery-schedule.entity';
import { DeliverySchedulesService } from './delivery-schedules.service';
import { DeliverySchedulesController } from './delivery-schedules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliverySchedule])],
  controllers: [DeliverySchedulesController],
  providers: [DeliverySchedulesService],
  exports: [DeliverySchedulesService],
})
export class DeliverySchedulesModule {}
