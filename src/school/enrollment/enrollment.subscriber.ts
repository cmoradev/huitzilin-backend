import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Fee } from '../fee/entities/fee.entity';
import { Debit } from '../debit/entities/debit.entity';
import { generateDebits } from './helpers';

@EventSubscriber()
export class EnrollmentEventSubscriber implements EntitySubscriberInterface<Enrollment> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Enrollment;
  }

  async afterInsert(e: InsertEvent<Enrollment>) {
    if (!!e.entity.packageId && !!e.entity.studentId && !!e.entity.branchId) {
      const feeRepository = e.manager.getRepository(Fee);
      const enrollmentRepository = e.manager.getRepository(Enrollment);

      const fees = await feeRepository.find({
        where: { packageId: e.entity.packageId, autoLoad: true },
      });

      const debits = fees.reduce(
        (acc, fee) => [...acc, ...(generateDebits(fee, e.entity) as Debit[])],
        [] as Debit[],
      );

      // TODO - Revisar el insert en cascada
      if (debits.length) {
        await enrollmentRepository.save({
          id: e.entity.id,
          debts: debits,
        });
      }
    }

    return e;
  }
}
