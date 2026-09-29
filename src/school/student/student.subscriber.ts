import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Student } from './entities/student.entity';
import { getFullname, randomCode, titleCase } from 'src/common/helpers';
import { InjectDataSource } from '@nestjs/typeorm';

@EventSubscriber()
export class StudentEventSubscriber implements EntitySubscriberInterface<Student> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Student;
  }

  beforeInsert(e: InsertEvent<Student>) {
    e.entity.firstname = titleCase(`${e.entity.firstname || ''}`);
    e.entity.lastname = titleCase(`${e.entity.lastname || ''}`);

    e.entity.fullname = getFullname(e.entity);

    e.entity.code = randomCode();
  }

  beforeUpdate(e: UpdateEvent<Student>) {
    e.entity!.firstname = titleCase(`${e.entity!.firstname || ''}`);
    e.entity!.lastname = titleCase(`${e.entity!.lastname || ''}`);

    e.entity!.fullname = getFullname(e.entity as Student);
  }
}
