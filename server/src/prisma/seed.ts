
// This file is repurposed for TypeORM seeding.
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';

// Import all entities
import { User, Role } from '../entities/user.entity';
import { Staff } from '../entities/staff.entity';
import { SchoolClass } from '../entities/school-class.entity';
import { Student, StudentStatus } from '../entities/student.entity';
import { Subject } from '../entities/subject.entity';
import { ClassSubjectAssignment } from '../entities/class-subject-assignment.entity';
import { MpesaC2BTransaction } from '../entities/mpesa-c2b.entity';
import { Announcement } from '../entities/announcement.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { ClassFee } from '../entities/class-fee.entity';
import { CommunicationLog } from '../entities/communication-log.entity';
import { Exam } from '../entities/exam.entity';
import { Expense } from '../entities/expense.entity';
import { FeeItem } from '../entities/fee-item.entity';
import { Grade } from '../entities/grade.entity';
import { GradingRule } from '../entities/grading-rule.entity';
import { Payroll } from '../entities/payroll.entity';
import { PayrollEntry } from '../entities/payroll-entry.entity';
import { PayrollItem } from '../entities/payroll-item.entity';
import { ReportShareLog } from '../entities/report-share-log.entity';
import { SchoolEvent } from '../entities/school-event.entity';
import { TimetableEntry } from '../entities/timetable-entry.entity';
import { Transaction } from '../entities/transaction.entity';
import { SchoolSetting, GradingSystem } from '../entities/school-setting.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';

console.log('Starting seeder...');

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'saaslink_db',
    entities: [User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, Transaction, SchoolSetting, DarajaSetting],
    synchronize: true, // This will create/update the schema automatically
    logging: ['error'],
};

const AppDataSource = new DataSource(dataSourceOptions);

const runSeed = async () => {
    try {
        console.log('Initializing and synchronizing data source...');
        await AppDataSource.initialize();
        console.log('Data source initialized and schema synchronized successfully.');

        // The manual clearing loop is no longer needed. 
        // `synchronize: true` handles schema creation and drops old tables.

        console.log('Seeding new data...');
        const salt = await bcrypt.genSalt();

        // Repositories
        const userRepo = AppDataSource.getRepository(User);
        const staffRepo = AppDataSource.getRepository(Staff);
        const classRepo = AppDataSource.getRepository(SchoolClass);
        const studentRepo = AppDataSource.getRepository(Student);
        const subjectRepo = AppDataSource.getRepository(Subject);
        const assignmentRepo = AppDataSource.getRepository(ClassSubjectAssignment);
        const schoolSettingRepo = AppDataSource.getRepository(SchoolSetting);
        const darajaSettingRepo = AppDataSource.getRepository(DarajaSetting);

        // 1. Create Users
        const usersToCreate = [
            { name: 'Admin User', email: 'admin@saaslink.com', role: Role.Admin },
            { name: 'Accountant User', email: 'accountant@saaslink.com', role: Role.Accountant },
            { name: 'Alice Teacher', email: 'alice@saaslink.com', role: Role.Teacher },
            { name: 'Bob Teacher', email: 'bob@saaslink.com', role: Role.Teacher },
            { name: 'Charlie Parent', email: 'parent1@saaslink.com', role: Role.Parent },
            { name: 'Diana Parent', email: 'parent2@saaslink.com', role: Role.Parent },
        ];
        const createdUsers: User[] = [];
        for (const userData of usersToCreate) {
            const hashedPassword = await bcrypt.hash('password123', salt);
            const user = userRepo.create({
                ...userData,
                password: hashedPassword,
                avatarUrl: `https://i.pravatar.cc/150?u=${userData.email}`,
                status: 'Active',
            });
            const savedUser = await userRepo.save(user);
            createdUsers.push(savedUser);
        }
        console.log('Users seeded.');

        // 2. Create Staff
        const teacherUsers = createdUsers.filter(u => u.role === Role.Teacher);
        const staffToCreate = [
            { user: teacherUsers[0], name: 'Alice Teacher', role: 'Teacher', photoUrl: teacherUsers[0].avatarUrl, salary: 60000, joinDate: '2020-01-15', bankName: 'KCB', accountNumber: '123456789', kraPin: 'A001234567B', nssfNumber: '20012345', shaNumber: '30012345' },
            { user: teacherUsers[1], name: 'Bob Teacher', role: 'Teacher', photoUrl: teacherUsers[1].avatarUrl, salary: 58000, joinDate: '2021-05-20', bankName: 'Equity', accountNumber: '987654321', kraPin: 'A007654321C', nssfNumber: '20054321', shaNumber: '30054321' },
        ];
        const createdStaff: Staff[] = [];
        for (const staffData of staffToCreate) {
            const staff = staffRepo.create(staffData);
            const savedStaff = await staffRepo.save(staff);
            createdStaff.push(savedStaff);
        }
        console.log('Staff seeded.');

        // 3. Create Classes
        const classesToCreate = [
            { name: 'Grade 1', formTeacher: teacherUsers[0] },
            { name: 'Grade 2', formTeacher: teacherUsers[1] },
            { name: 'Grade 3', formTeacher: null },
            { name: 'Grade 4', formTeacher: null },
        ];
        const createdClasses: SchoolClass[] = [];
        for (const classData of classesToCreate) {
            const schoolClass = classRepo.create(classData);
            const savedClass = await classRepo.save(schoolClass);
            createdClasses.push(savedClass);
        }
        console.log('Classes seeded.');

        // 4. Create Students
        const studentsToCreate = [
            { name: 'Liam Smith', schoolClass: createdClasses[0], guardianName: 'Charlie Parent', guardianEmail: 'parent1@saaslink.com' },
            { name: 'Olivia Johnson', schoolClass: createdClasses[0], guardianName: 'Diana Parent', guardianEmail: 'parent2@saaslink.com' },
            { name: 'Noah Williams', schoolClass: createdClasses[1], guardianName: 'Charlie Parent', guardianEmail: 'parent1@saaslink.com' },
            { name: 'Emma Brown', schoolClass: createdClasses[1], guardianName: 'Diana Parent', guardianEmail: 'parent2@saaslink.com' },
            { name: 'Oliver Jones', schoolClass: createdClasses[2], guardianName: 'Gary Guardian', guardianEmail: 'gary@example.com' },
        ];
        const year = new Date().getFullYear();
        let studentCount = 0;
        for (const studentData of studentsToCreate) {
            studentCount++;
            const student = studentRepo.create({
                ...studentData,
                admissionNumber: `${year}-${String(studentCount).padStart(4, '0')}`,
                status: StudentStatus.Active,
                profileImage: `https://i.pravatar.cc/150?u=${studentData.name.replace(' ', '')}`,
                guardianContact: '0712345678',
                guardianAddress: '123 Fake St, Nairobi',
                emergencyContact: '0787654321',
                dateOfBirth: '2015-01-01',
            });
            await studentRepo.save(student);
        }
        console.log('Students seeded.');
        
        // 5. Create Subjects and Assignments
        const subjectsToCreate = [{ name: 'English' }, { name: 'Mathematics' }, { name: 'Science' }];
        const createdSubjects = await subjectRepo.save(subjectRepo.create(subjectsToCreate));
        console.log('Subjects seeded.');

        const assignmentsToCreate = [
            { class: createdClasses[0], subject: createdSubjects[0], teacher: teacherUsers[0] },
            { class: createdClasses[0], subject: createdSubjects[1], teacher: teacherUsers[1] },
            { class: createdClasses[1], subject: createdSubjects[0], teacher: teacherUsers[0] },
            { class: createdClasses[1], subject: createdSubjects[1], teacher: teacherUsers[1] },
        ];
        await assignmentRepo.save(assignmentRepo.create(assignmentsToCreate));
        console.log('Assignments seeded.');
        
        // 6. Seed Settings
        await schoolSettingRepo.save(schoolSettingRepo.create({
            name: "Springfield Elementary",
            address: "123 Main St, Springfield",
            phone: "555-1234",
            email: "contact@springfield.edu",
            logoUrl: "/public/uploads/default_logo.png",
            gradingSystem: GradingSystem.Traditional,
            schoolCode: 'SPE',
        }));
        await darajaSettingRepo.save(darajaSettingRepo.create({
            consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: ''
        }));

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
        exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Data source closed.');
        }
    }
};

runSeed();
