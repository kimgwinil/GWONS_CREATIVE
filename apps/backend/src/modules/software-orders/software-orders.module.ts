import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoftwareOrder } from './entities/software-order.entity';
import { SoftwareOrdersService } from './software-orders.service';
import { SoftwareOrdersController } from './software-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SoftwareOrder])],
  controllers: [SoftwareOrdersController],
  providers: [SoftwareOrdersService],
  exports: [SoftwareOrdersService],
})
export class SoftwareOrdersModule {}
