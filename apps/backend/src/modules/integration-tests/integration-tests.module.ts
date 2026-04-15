import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationTest } from './entities/integration-test.entity';
import { IntegrationTestsService } from './integration-tests.service';
import { IntegrationTestsController } from './integration-tests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationTest])],
  controllers: [IntegrationTestsController],
  providers: [IntegrationTestsService],
  exports: [IntegrationTestsService],
})
export class IntegrationTestsModule {}
