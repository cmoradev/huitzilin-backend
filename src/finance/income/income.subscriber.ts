import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Income } from './entities/income.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@EventSubscriber()
export class IncomeEventSubscriber implements EntitySubscriberInterface<Income> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Income;
  }

  async beforeInsert(e: InsertEvent<Income>) {
    e.entity.folio = await this.generateFolio(e);

    return e;
  }

  private async generateFolio(e: InsertEvent<Income>): Promise<number> {
    if (e.entity.branchId) {
      const incomeRepository = e.manager.getRepository(Income);

      const count = await incomeRepository.count({
        where: { branchId: e.entity.branchId },
        withDeleted: true,
      });

      return count + 1;
    }

    return 1;
  }
}
