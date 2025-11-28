
// This file is repurposed for TypeORM seeding.
import 'dotenv/config';
import { DataSource, DataSourceOptions, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Import all entities
import { 
    User, Role, Staff, SchoolClass, Student, StudentStatus, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, GradingSystem, DarajaSetting,
    TransactionType, PaymentMethod, ExpenseCategory
} from '../entities/all-entities';


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
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const expenseRepo = AppDataSource.getRepository(Expense);

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
            const existingUser = await userRepo.findOneBy({ email: userData.email });
            if (existingUser) {
                createdUsers.push(existingUser);
                continue;
            }
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
        
        for (const staffData of staffToCreate) {
             if(!staffData.user) continue;
             const existingStaff = await staffRepo.findOneBy({ userId: staffData.user.id });
             if (!existingStaff) {
                const staff = staffRepo.create(staffData);
                await staffRepo.save(staff);
             }
        }
        console.log('Staff seeded.');

        // 3. Create Classes
        const classesToCreate = [
            { name: 'Grade 1', formTeacher: teacherUsers[0], classCode: '001' },
            { name: 'Grade 2', formTeacher: teacherUsers[1], classCode: '002' },
            { name: 'Grade 3', formTeacher: null, classCode: '003' },
            { name: 'Grade 4', formTeacher: null, classCode: '004' },
        ];
        const createdClasses: SchoolClass[] = [];
        for (const classData of classesToCreate) {
            let schoolClass = await classRepo.findOneBy({ name: classData.name });
            if (!schoolClass) {
                schoolClass = await classRepo.save(classRepo.create(classData));
            }
            createdClasses.push(schoolClass);
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
        const savedStudents: Student[] = [];

        for (const studentData of studentsToCreate) {
            studentCount++;
            const admissionNumber = `SPE00${studentCount}${year}`;
            let student = await studentRepo.findOneBy({ admissionNumber });
            
            if (!student) {
                student = await studentRepo.save(studentRepo.create({
                    ...studentData,
                    admissionNumber,
                    status: StudentStatus.Active,
                    profileImage: `https://i.pravatar.cc/150?u=${studentData.name.replace(' ', '')}`,
                    guardianContact: '0712345678',
                    guardianAddress: '123 Fake St, Nairobi',
                    emergencyContact: '0787654321',
                    dateOfBirth: '2015-01-01',
                }));
            }
            savedStudents.push(student);
        }
        console.log('Students seeded.');
        
        // 5. Create Subjects and Assignments
        const subjectsToCreate = [{ name: 'English' }, { name: 'Mathematics' }, { name: 'Science' }];
        const createdSubjects: Subject[] = [];
        for (const sub of subjectsToCreate) {
            let subject = await subjectRepo.findOneBy({ name: sub.name });
            if (!subject) {
                subject = await subjectRepo.save(subjectRepo.create(sub));
            }
            createdSubjects.push(subject);
        }

        // Only create assignments if they don't exist
        const countAssignments = await assignmentRepo.count();
        if (countAssignments === 0) {
             const assignmentsToCreate = [
                { class: createdClasses[0], subject: createdSubjects[0], teacher: teacherUsers[0] },
                { class: createdClasses[0], subject: createdSubjects[1], teacher: teacherUsers[1] },
                { class: createdClasses[1], subject: createdSubjects[0], teacher: teacherUsers[0] },
                { class: createdClasses[1], subject: createdSubjects[1], teacher: teacherUsers[1] },
            ];
            await assignmentRepo.save(assignmentRepo.create(assignmentsToCreate));
            console.log('Assignments seeded.');
        }

        // 6. Seed Settings
        const settingCount = await schoolSettingRepo.count();
        if (settingCount === 0) {
             await schoolSettingRepo.save(schoolSettingRepo.create({
                name: "Springfield Elementary",
                address: "123 Main St, Springfield",
                phone: "555-1234",
                email: "contact@springfield.edu",
                logoUrl: "/public/uploads/default_logo.png",
                gradingSystem: GradingSystem.Traditional,
                schoolCode: 'SPE',
            }));
        }
        const darajaCount = await darajaSettingRepo.count();
        if (darajaCount === 0) {
            await darajaSettingRepo.save(darajaSettingRepo.create({
                consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: ''
            }));
        }

        // 7. Seed Financial Data (Transactions & Expenses) for Dashboard
        console.log('Seeding financial data for dashboard...');
        
        // Create Expenses (last 6 months)
        const expenseCount = await expenseRepo.count();
        if (expenseCount < 10) { // Only seed if minimal data exists
            const expenseCategories = Object.values(ExpenseCategory);
            const expenses: DeepPartial<Expense>[] = [];
            const today = new Date();
            
            for (let i = 0; i < 6; i++) { // For each of the last 6 months
                const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
                // Create 5 random expenses per month
                for (let j = 0; j < 5; j++) {
                     const day = Math.floor(Math.random() * 25) + 1;
                     const dateStr = new Date(month.getFullYear(), month.getMonth(), day).toISOString().split('T')[0];
                     
                     expenses.push({
                        category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
                        description: `Monthly Expense ${i}-${j}`,
                        amount: Math.floor(Math.random() * 20000) + 2000,
                        date: dateStr,
                    });
                }
            }
            await expenseRepo.save(expenseRepo.create(expenses));
            console.log('Expenses seeded.');
        }

        // Create Transactions (Invoices & Payments)
        const transactionCount = await transactionRepo.count();
        if (transactionCount < 10) { // Only seed if minimal data exists
            const transactions: DeepPartial<Transaction>[] = [];
            const today = new Date();
            
            for (const student of savedStudents) {
                // Loop through last 6 months to create termly fees and payments
                for (let i = 0; i < 6; i++) {
                     const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
                     // Add an invoice at start of month
                     transactions.push({
                        student: student,
                        type: TransactionType.Invoice,
                        date: new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0],
                        description: `Tuition Fee - ${month.toLocaleString('default', { month: 'long' })}`,
                        amount: 15000,
                    });

                    // Add a payment mid-month (sometimes skip to create deficit)
                    if (Math.random() > 0.2) {
                        transactions.push({
                            student: student,
                            type: TransactionType.Payment,
                            date: new Date(month.getFullYear(), month.getMonth(), 15).toISOString().split('T')[0],
                            description: 'School Fees Payment',
                            amount: 15000,
                            method: PaymentMethod.MPesa,
                            transactionCode: `SD${Math.floor(Math.random() * 100000)}`
                        });
                    }
                }
            }
            await transactionRepo.save(transactionRepo.create(transactions));
            console.log('Transactions seeded.');
        }
        
        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
        (process as any).exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Data source closed.');
        }
    }
};

runSeed();
