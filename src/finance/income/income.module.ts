import { Module } from '@nestjs/common';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { Discount } from 'src/miscellaneous';
import { Debit } from 'src/school';
import { IncomeDto } from './dto/income.dto';
import { Income } from './entities/income.entity';
import { IncomeResolver } from './income.resolver';
import { IncomeService } from './income.service';
import { IncomeEventSubscriber } from './income.subscriber';
import { Concept } from '../concept/entities/concept.entity';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([
          Income,
          Debit,
          Discount,
          Concept,
        ]),
      ],
      services: [IncomeService],
      resolvers: [
        {
          DTOClass: IncomeDto,
          ServiceClass: IncomeService,
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
          enableSubscriptions: false,
          create: { many: { disabled: true }, one: { disabled: true } },
          update: { many: { disabled: true }, one: { disabled: true } },
          delete: { many: { disabled: true }, one: { disabled: true } },
        },
      ],
    }),
  ],
  providers: [IncomeResolver, IncomeEventSubscriber],
})
export class IncomeModule {}
