import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { ClassLevel } from '../src/modules/academics/entities/class-level.entity';
import { Section } from '../src/modules/academics/entities/section.entity';
import { AcademicYear } from '../src/modules/academics/entities/academic-year.entity';
import { Subject } from '../src/modules/academics/entities/subject.entity';
import { Student } from '../src/modules/students/entities/student.entity';
import { UserRole } from '../src/common/user-role.enum';
import { SubscriptionPlan, SubscriptionStatus } from '../src/common/subscription.enums';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function seed() {
  const dbHost = process.env.DB_HOST || 'localhost';

  const dataSource = new DataSource({
    type: 'mysql',
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'saaslink',
    entities: ['src/modules/**/*.entity.ts'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);
  const academicYearRepo = dataSource.getRepository(AcademicYear);
  const classLevelRepo = dataSource.getRepository(ClassLevel);
  const sectionRepo = dataSource.getRepository(Section);
  const subjectRepo = dataSource.getRepository(Subject);
  const studentRepo = dataSource.getRepository(Student);

  // 1. Create Demo Tenant
  let demoTenant = await tenantRepo.findOne({ where: { domain: 'demo.saaslink.tech' } });
  if (!demoTenant) {
    demoTenant = tenantRepo.create({
      name: 'Demo International School',
      domain: 'demo.saaslink.tech',
      plan: SubscriptionPlan.PREMIUM,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });
    await tenantRepo.save(demoTenant);
    console.log('Created Demo Tenant');
  } else {
    console.log('Demo Tenant already exists');
  }

  const tenantId = demoTenant.id;

  // 2. Create Academic Year
  let academicYear = await academicYearRepo.findOne({ where: { name: '2026/2027', tenantId } });
  if (!academicYear) {
    academicYear = academicYearRepo.create({
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
      tenantId,
    });
    await academicYearRepo.save(academicYear);
    console.log('Created Academic Year');
  }

  // 3. Create Class Levels
  const classLevelsData = ['Grade 10', 'Grade 11', 'Grade 12'];
  const classLevels = [];
  for (const name of classLevelsData) {
    let cl = await classLevelRepo.findOne({ where: { name, tenantId } });
    if (!cl) {
      cl = classLevelRepo.create({ name, description: `${name} High School`, tenantId });
      await classLevelRepo.save(cl);
      console.log(`Created Class Level: ${name}`);
    }
    classLevels.push(cl);
  }

  // 4. Create Sections
  const sectionsData = ['A', 'B'];
  const sections = [];
  for (const cl of classLevels) {
    for (const name of sectionsData) {
      let sec = await sectionRepo.findOne({ where: { name, classLevelId: cl.id, tenantId } });
      if (!sec) {
        sec = sectionRepo.create({ name, classLevelId: cl.id, room: `Room ${cl.name.split(' ')[1]}${name}`, tenantId });
        await sectionRepo.save(sec);
        console.log(`Created Section ${name} for ${cl.name}`);
      }
      sections.push(sec);
    }
  }

  // 5. Create Users (Admin, Teacher, Parent)
  const salt = await bcrypt.genSalt();
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, salt);

  const usersData = [
    { username: 'admin@demo.com', role: UserRole.ADMIN },
    { username: 'teacher@demo.com', role: UserRole.TEACHER },
    { username: 'parent@demo.com', role: UserRole.PARENT },
  ];

  const createdUsers = {};
  for (const u of usersData) {
    let user = await userRepo.findOne({ where: { username: u.username, tenantId } });
    if (!user) {
      user = userRepo.create({
        username: u.username,
        password_hash: hashedPassword,
        role: u.role,
        tenantId,
      });
      await userRepo.save(user);
      console.log(`Created User: ${u.username} (${u.role})`);
    }
    createdUsers[u.role] = user;
  }

  // 6. Create Subjects
  const subjectsData = ['Mathematics', 'Science', 'History', 'English'];
  for (const name of subjectsData) {
    let sub = await subjectRepo.findOne({ where: { name, classLevel: classLevels[0].id, tenantId } });
    if (!sub) {
      sub = subjectRepo.create({
        name,
        classLevel: classLevels[0].id, // Assigning to Grade 10 for simplicity
        teacherId: createdUsers[UserRole.TEACHER]?.id,
        tenantId,
      });
      await subjectRepo.save(sub);
      console.log(`Created Subject: ${name}`);
    }
  }

  // 7. Create Students
  const studentsData = [
    { firstName: 'Alice', lastName: 'Johnson', regNo: 'STU2026001' },
    { firstName: 'Bob', lastName: 'Smith', regNo: 'STU2026002' },
    { firstName: 'Charlie', lastName: 'Brown', regNo: 'STU2026003' },
  ];

  for (let i = 0; i < studentsData.length; i++) {
    const s = studentsData[i];
    let student = await studentRepo.findOne({ where: { registrationNumber: s.regNo, tenantId } });
    if (!student) {
      student = studentRepo.create({
        firstName: s.firstName,
        lastName: s.lastName,
        registrationNumber: s.regNo,
        classLevelId: classLevels[0].id, // Grade 10
        sectionId: sections[0].id, // Section A
        academicYearId: academicYear.id,
        status: 'Active',
        parentId: createdUsers[UserRole.PARENT]?.id,
        tenantId,
      });
      await studentRepo.save(student);
      console.log(`Created Student: ${s.firstName} ${s.lastName}`);
    }
  }

  // 8. Create Timetable Entries
  const { TimetableEntry } = require('../src/modules/timetable/entities/timetable-entry.entity');
  const timetableRepo = dataSource.getRepository(TimetableEntry);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const createdSubjects = await subjectRepo.find({ where: { tenantId } });
  const timetableData = [
    { classLevel: 'Grade 10A', dayOfWeek: today as any, startTime: '08:00', endTime: '09:30', subjectId: createdSubjects[0]?.id, teacherId: createdUsers[UserRole.TEACHER]?.id },
    { classLevel: 'Grade 10A', dayOfWeek: today as any, startTime: '10:00', endTime: '11:30', subjectId: createdSubjects[1]?.id, teacherId: createdUsers[UserRole.TEACHER]?.id },
  ];

  for (const t of timetableData) {
    if (!t.subjectId || !t.teacherId) continue;
    let entry = await timetableRepo.findOne({ where: { classLevel: t.classLevel, startTime: t.startTime, tenantId } });
    if (!entry) {
      entry = timetableRepo.create({ ...t, tenantId });
      await timetableRepo.save(entry);
      console.log(`Created Timetable Entry: ${t.subjectId} at ${t.startTime}`);
    }
  }

  // 9. Create Fees
  const { Fee } = require('../src/modules/fees/entities/fee.entity');
  const feeRepo = dataSource.getRepository(Fee);
  for (const s of studentsData) {
    const student = await studentRepo.findOne({ where: { registrationNumber: s.regNo, tenantId } });
    if (student) {
      let fee = await feeRepo.findOne({ where: { studentId: student.id, tenantId } });
      if (!fee) {
        fee = feeRepo.create({
          studentId: student.id,
          amount: 500,
          dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          status: 'unpaid',
          tenantId,
        });
        await feeRepo.save(fee);
      }
    }
  }

  // 10. Create Calendar Events
  const { CalendarEvent } = require('../src/modules/calendar/entities/calendar-event.entity');
  const calendarRepo = dataSource.getRepository(CalendarEvent);
  const eventsData = [
    { title: 'Parent-Teacher Conference', start: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), end: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) },
    { title: 'Science Fair', start: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), end: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000) },
  ];

  for (const ev of eventsData) {
    let event = await calendarRepo.findOne({ where: { title: ev.title, tenantId } });
    if (!event) {
      event = calendarRepo.create({ ...ev, tenantId });
      await calendarRepo.save(event);
    }
  }

  // 11. Create Examinations and Report Cards
  const { Examination } = require('../src/modules/examinations/entities/examination.entity');
  const { ReportCard } = require('../src/modules/report-cards/entities/report-card.entity');
  const examRepo = dataSource.getRepository(Examination);
  const reportCardRepo = dataSource.getRepository(ReportCard);
  
  let exam = await examRepo.findOne({ where: { name: 'Midterm Exam', tenantId } });
  if (!exam && createdSubjects.length > 0) {
    exam = examRepo.create({
      name: 'Midterm Exam',
      subjectId: createdSubjects[0].id,
      date: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      totalMarks: 100,
      tenantId,
    });
    await examRepo.save(exam);
  }

  let recentExam = await examRepo.findOne({ where: { name: 'Recent Quiz', tenantId } });
  if (!recentExam && createdSubjects.length > 1) {
    recentExam = examRepo.create({
      name: 'Recent Quiz',
      subjectId: createdSubjects[1].id,
      date: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      totalMarks: 50,
      tenantId,
    });
    await examRepo.save(recentExam);
  }

  if (exam) {
    for (const s of studentsData) {
      const student = await studentRepo.findOne({ where: { registrationNumber: s.regNo, tenantId } });
      if (student) {
        let rc = await reportCardRepo.findOne({ where: { studentId: student.id, examinationId: exam.id, tenantId } });
        if (!rc) {
          rc = reportCardRepo.create({
            studentId: student.id,
            examinationId: exam.id,
            marks: Math.floor(Math.random() * 40) + 60, // 60-100
            grade: 'A',
            remarks: 'Good performance',
            tenantId,
          });
          await reportCardRepo.save(rc);
        }
      }
    }
  }

  console.log('Seeding completed successfully!');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});
