import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignReview } from './entities/design-review.entity';
import { DesignReviewsService } from './design-reviews.service';
import { DesignReviewsController } from './design-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DesignReview])],
  controllers: [DesignReviewsController],
  providers: [DesignReviewsService],
  exports: [DesignReviewsService],
})
export class DesignReviewsModule {}
