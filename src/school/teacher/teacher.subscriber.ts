import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { getFullname, titleCase } from 'src/common/helpers';
import { InjectDataSource } from '@nestjs/typeorm';

@EventSubscriber()
export class TeacherEventSubscriber implements EntitySubscriberInterface<Teacher> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Teacher;
  }

  beforeInsert(e: InsertEvent<Teacher>) {
    e.entity.firstname = titleCase(`${e.entity.firstname || ''}`);
    e.entity.lastname = titleCase(`${e.entity.lastname || ''}`);
    e.entity.fullname = getFullname(e.entity);
  }

  beforeUpdate(e: UpdateEvent<Teacher>) {
    e.entity!.firstname = titleCase(`${e.entity!.firstname || ''}`);
    e.entity!.lastname = titleCase(`${e.entity!.lastname || ''}`);
    e.entity!.fullname = getFullname(e.entity as Teacher);
  }
}
