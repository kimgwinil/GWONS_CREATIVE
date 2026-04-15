import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentInstallation } from './entities/content-installation.entity';
import { ContentInstallationsService } from './content-installations.service';
import { ContentInstallationsController } from './content-installations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContentInstallation])],
  controllers: [ContentInstallationsController],
  providers: [ContentInstallationsService],
  exports: [ContentInstallationsService],
})
export class ContentInstallationsModule {}
