import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';

@EventSubscriber()
export class PaymentEventSubscriber implements EntitySubscriberInterface<Payment> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Payment;
  }

  async beforeInsert(e: InsertEvent<Payment>) {
    e.entity.folio = await this.generateFolio(e);

    return e;
  }

  private async generateFolio(e: InsertEvent<Payment>): Promise<number> {
    const paymentRepository = e.manager.getRepository(Payment);

    const count = await paymentRepository.count({
      withDeleted: true,
    });

    return count + 1;
  }
}
