import { Module } from '@nestjs/common';
import { DiscountModule } from './discounts/discounts.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [DiscountModule, ReportsModule],
})
export class MiscellaneousModule {}
