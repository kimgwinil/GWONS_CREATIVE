import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CadDrawing } from './entities/cad-drawing.entity';
import { CadDrawingsService } from './cad-drawings.service';
import { CadDrawingsController } from './cad-drawings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CadDrawing])],
  controllers: [CadDrawingsController],
  providers: [CadDrawingsService],
  exports: [CadDrawingsService],
})
export class CadDrawingsModule {}
