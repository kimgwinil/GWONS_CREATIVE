import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasicDesign } from './entities/basic-design.entity';
import { BasicDesignsService } from './basic-designs.service';
import { BasicDesignsController } from './basic-designs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BasicDesign])],
  controllers: [BasicDesignsController],
  providers: [BasicDesignsService],
  exports: [BasicDesignsService],
})
export class BasicDesignsModule {}
