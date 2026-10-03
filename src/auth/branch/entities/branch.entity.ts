import { User } from 'src/auth';
import { Base } from 'src/common/utils/base.entity';
import { Income } from 'src/finance';
import { Discount } from 'src/miscellaneous';
import {
  Debit,
  Discipline,
  Enrollment,
  Level,
  Package,
  Period,
  Student,
  Teacher,
  Tutor,
} from 'src/school';
import { Schedule } from 'src/school/schedule/entities/schedule.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';

@Entity({ schema: 'auth', name: 'branchs' })
export class Branch extends Base {
  @Column({ type: 'varchar', nullable: false, length: 128 })
  picture: string;

  @Column({ type: 'varchar', nullable: false, length: 16 })
  name: string;

  @OneToMany(() => User, (action) => action.branch)
  users: User[];

  @OneToMany(() => Package, (pack) => pack.branch)
  packages: Package[];

  @OneToMany(() => Schedule, (schedule) => schedule.branch)
  schedules: Schedule[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.branch)
  enrollments: Enrollment[];

  @OneToMany(() => Level, (level) => level.branch)
  levels: Level[];

  @OneToMany(() => Discount, (discount) => discount.branch)
  discounts: Discount[];

  @OneToMany(() => Discipline, (discipline) => discipline.branch)
  disciplines: Discipline[];

  @OneToMany(() => Period, (period) => period.branch)
  periods: Period[];

  @OneToMany(() => Income, (income) => income.branch)
  incomes: Income[];

  @OneToMany(() => Debit, (debit) => debit.student)
  debts: Debit[];

  @ManyToMany(() => Student, (student) => student.branchs)
  students: Student[];

  @ManyToMany(() => Teacher, (teacher) => teacher.branchs)
  teachers: Teacher[];

  @ManyToMany(() => Tutor, (tutor) => tutor.branchs)
  tutors: Tutor[];
}
