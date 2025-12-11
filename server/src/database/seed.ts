
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { 
    User, Role, Staff, SchoolClass, Student, StudentStatus, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, GradingSystem, DarajaSetting,
    School, Subscription, SubscriptionPlan, SubscriptionStatus,
    Book, LibraryTransaction
} from '../entities/all-entities';

console.log('Starting seeder...');

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'saaslink_db',
    entities: [
        User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
        Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
        GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
        Transaction, SchoolSetting, DarajaSetting, School, Subscription, Book, LibraryTransaction
    ],
    synchronize: true, // Use with caution in prod
    logging: ['error'],
};

const AppDataSource = new DataSource(dataSourceOptions);

const runSeed = async () => {
    try {
        console.log('Initializing and synchronizing data source...');
        await AppDataSource.initialize();
        console.log('Data source initialized.');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password123', salt);

        const schoolRepo = AppDataSource.getRepository(School);
        const subRepo = AppDataSource.getRepository(Subscription);
        const userRepo = AppDataSource.getRepository(User);
        const staffRepo = AppDataSource.getRepository(Staff);
        const classRepo = AppDataSource.getRepository(SchoolClass);
        const studentRepo = AppDataSource.getRepository(Student);
        const subjectRepo = AppDataSource.getRepository(Subject);
        const assignmentRepo = AppDataSource.getRepository(ClassSubjectAssignment);
        const darajaRepo = AppDataSource.getRepository(DarajaSetting);

        // 1. Create a Default School
        let school = await schoolRepo.findOne({ where: { slug: 'springfield-elementary' } });
        if (!school) {
            school = schoolRepo.create({
                name: "Springfield Elementary",
                slug: "springfield-elementary",
                address: "123 Main St, Springfield",
                phone: "555-1234",
                email: "contact@springfield.edu",
                logoUrl: "/public/uploads/default_logo.png",
                gradingSystem: GradingSystem.Traditional,
                schoolCode: 'SPE',
            });
            school = await schoolRepo.save(school);
            console.log('Default School created.');

            const sub = subRepo.create({
                school,
                plan: SubscriptionPlan.PREMIUM,
                status: SubscriptionStatus.ACTIVE,
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            });
            await subRepo.save(sub);
        }

        // 2. Upsert Users (Ensure SuperAdmin and others exist with correct roles)
        const usersToCreate = [
            { name: 'Platform Owner', email: 'super@saaslink.com', role: Role.SuperAdmin, school: null },
            { name: 'Admin User', email: 'admin@saaslink.com', role: Role.Admin, school: school },
            { name: 'Accountant User', email: 'accountant@saaslink.com', role: Role.Accountant, school: school },
            { name: 'Alice Teacher', email: 'alice@saaslink.com', role: Role.Teacher, school: school },
            { name: 'Bob Teacher', email: 'bob@saaslink.com', role: Role.Teacher, school: school },
            { name: 'Charlie Parent', email: 'parent1@saaslink.com', role: Role.Parent, school: school },
            { name: 'Diana Parent', email: 'parent2@saaslink.com', role: Role.Parent, school: school },
        ];
        
        const createdUsers: User[] = [];
        for (const userData of usersToCreate) {
            let user = await userRepo.findOne({ where: { email: userData.email } });
            
            if (!user) {
                user = userRepo.create({
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    school: userData.school || undefined,
                    status: 'Active',
                    avatarUrl: `https://i.pravatar.cc/150?u=${userData.email}`
                });
                console.log(`Creating user: ${userData.email}`);
            } else {
                // Critical: Update role if it's different (fixes missing SuperAdmin privileges)
                user.role = userData.role;
                user.school = userData.school || null as any;
                if (!user.password) user.password = hashedPassword;
                console.log(`Updating user: ${userData.email}`);
            }
            
            const savedUser = await userRepo.save(user);
            createdUsers.push(savedUser);
        }

        // 3. Create Staff
        const teacherUsers = createdUsers.filter(u => u.role === Role.Teacher);
        for (const teacher of teacherUsers) {
            const existing = await staffRepo.findOne({ where: { userId: teacher.id } });
            if (!existing) {
                const staff = staffRepo.create({
                    user: teacher,
                    userId: teacher.id,
                    name: teacher.name,
                    role: 'Teacher',
                    photoUrl: teacher.avatarUrl,
                    salary: 50000 + Math.random() * 10000,
                    joinDate: new Date().toISOString().split('T')[0],
                    bankName: 'Equity',
                    accountNumber: '123456',
                    kraPin: 'A00' + Math.floor(Math.random()*1000000),
                    nssfNumber: '200' + Math.floor(Math.random()*100000),
                    shaNumber: '300' + Math.floor(Math.random()*100000),
                    school: school
                });
                await staffRepo.save(staff);
            }
        }

        // 4. Create Classes
        const classNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
        const createdClasses: SchoolClass[] = [];
        
        for (let i = 0; i < classNames.length; i++) {
            let cls = await classRepo.findOne({ where: { name: classNames[i], school: { id: school.id } } });
            if (!cls) {
                // Ensure Unique Form Teacher assignment
                // We use i % teacherUsers.length logic, but check if that teacher is already assigned
                const teacher = i < teacherUsers.length ? teacherUsers[i] : null;
                // Check if this teacher is already assigned to another class
                const isAssigned = teacher ? await classRepo.findOne({ where: { formTeacher: { id: teacher.id } } }) : false;

                cls = classRepo.create({
                    name: classNames[i],
                    classCode: `G${i+1}`,
                    formTeacher: isAssigned ? null : teacher,
                    school: school
                });
                cls = await classRepo.save(cls);
            }
            createdClasses.push(cls);
        }

        // 5. Create Students
        if ((await studentRepo.count({ where: { school: { id: school.id } } })) === 0) {
            const studentsToCreate = [
                { name: 'Liam Smith', schoolClass: createdClasses[0], guardianName: 'Charlie Parent', guardianEmail: 'parent1@saaslink.com' },
                { name: 'Olivia Johnson', schoolClass: createdClasses[0], guardianName: 'Diana Parent', guardianEmail: 'parent2@saaslink.com' },
                { name: 'Noah Williams', schoolClass: createdClasses[1], guardianName: 'Charlie Parent', guardianEmail: 'parent1@saaslink.com' },
            ];
            
            const year = new Date().getFullYear();
            let studentCount = 0;
            for (const data of studentsToCreate) {
                studentCount++;
                const student = studentRepo.create({
                    ...data,
                    admissionNumber: `${year}-${String(studentCount).padStart(4, '0')}`,
                    status: StudentStatus.Active,
                    profileImage: `https://i.pravatar.cc/150?u=${data.name.replace(' ', '')}`,
                    guardianContact: '0712345678',
                    guardianAddress: '123 Fake St, Nairobi',
                    emergencyContact: '0787654321',
                    dateOfBirth: '2015-01-01',
                    school: school
                });
                await studentRepo.save(student);
            }
        }

        // 6. Create Subjects
        const subjects = ['Mathematics', 'English', 'Science'];
        const createdSubjects: Subject[] = [];
        for (const name of subjects) {
            let subj = await subjectRepo.findOne({ where: { name, school: { id: school.id } } });
            if (!subj) {
                subj = subjectRepo.create({ name, school });
                subj = await subjectRepo.save(subj);
            }
            createdSubjects.push(subj);
        }

        // 7. Settings (Daraja)
        let daraja = await darajaRepo.findOne({ where: { school: { id: school.id } } });
        if (!daraja) {
            daraja = darajaRepo.create({
                consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: '',
                school: school
            });
            await darajaRepo.save(daraja);
        }

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
        (process as any).exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
};

runSeed();
