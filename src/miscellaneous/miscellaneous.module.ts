import { Module } from '@nestjs/common';
import { DiscountModule } from './discounts/discounts.module';
import { ClipAccountsModule } from './clip-accounts/clip-accounts.module';
import { ClipLinksModule } from './clip-links/clip-links.module';
import { WebhookModule } from './webhook/webhook.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    DiscountModule,
    ClipAccountsModule,
    ClipLinksModule,
    WebhookModule,
    ReportsModule,
  ],
})
export class MiscellaneousModule {}
