import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IncomeDto } from './dto/income.dto';
import { IncomeService } from './income.service';
import {
  AddPaymentInput,
  CreateIncomeInput,
  CreateLinkIncomeInput,
} from './dto';
import { AccountsReceivableInput } from './dto/accounts-receivable.input';

@Resolver(() => IncomeDto)
export class IncomeResolver {
  constructor(private readonly incomeService: IncomeService) {}

  @Query(() => IncomeDto)
  getAccountsReceivable(
    @Args('input', { type: () => AccountsReceivableInput })
    params: AccountsReceivableInput,
  ): Promise<IncomeDto> {
    return this.incomeService.getAccountsReceivable(params);
  }

  @Mutation(() => [IncomeDto])
  createLinkIncomes(
    @Args('input', { type: () => CreateLinkIncomeInput })
    params: CreateLinkIncomeInput,
  ): Promise<IncomeDto[]> {
    return this.incomeService.createLinkIncomes(params);
  }

  @Mutation(() => [IncomeDto])
  createIncomes(
    @Args('input', { type: () => CreateIncomeInput })
    params: CreateIncomeInput,
  ): Promise<IncomeDto[]> {
    return this.incomeService.createIncomes(params);
  }

  @Mutation(() => IncomeDto)
  addPaymentToIncome(
    @Args('input', { type: () => AddPaymentInput })
    params: AddPaymentInput,
  ): Promise<IncomeDto> {
    return this.incomeService.addPaymentToIncome(params);
  }
}
