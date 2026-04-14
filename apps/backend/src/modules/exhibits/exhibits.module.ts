import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibit } from './entities/exhibit.entity';
import { ExhibitsService } from './exhibits.service';
import { ExhibitsController } from './exhibits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Exhibit])],
  controllers: [ExhibitsController],
  providers: [ExhibitsService],
  exports: [ExhibitsService],
})
export class ExhibitsModule {}
