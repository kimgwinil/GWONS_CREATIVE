import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementList } from './entities/procurement-list.entity';
import { ProcurementListsService } from './procurement-lists.service';
import { ProcurementListsController } from './procurement-lists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProcurementList])],
  controllers: [ProcurementListsController],
  providers: [ProcurementListsService],
  exports: [ProcurementListsService],
})
export class ProcurementListsModule {}
