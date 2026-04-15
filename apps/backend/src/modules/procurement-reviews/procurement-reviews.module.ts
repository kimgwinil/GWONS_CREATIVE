import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementReview } from './entities/procurement-review.entity';
import { ProcurementReviewsService } from './procurement-reviews.service';
import { ProcurementReviewsController } from './procurement-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProcurementReview])],
  controllers: [ProcurementReviewsController],
  providers: [ProcurementReviewsService],
  exports: [ProcurementReviewsService],
})
export class ProcurementReviewsModule {}
