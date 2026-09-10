
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { 
    User, Role, Staff, SchoolClass, Student, StudentStatus, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, GradingSystem, DarajaSetting,
    School, Subscription, SubscriptionPlan, SubscriptionStatus,
    Book, LibraryTransaction, PlatformSetting
} from '../entities/all-entities';

console.log('Starting seeder...');

if (process.env.NODE_ENV === 'production') {
    console.error('❌  CRITICAL: Seeding is not allowed in PRODUCTION environment to prevent data loss.');
    (process as any).exit(1);
}

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
        Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting
    ],
    synchronize: true,
    dropSchema: false,
    logging: ['error'],
};

const AppDataSource = new DataSource(dataSourceOptions);

const runSeed = async () => {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        
        console.log('🔄  Synchronizing Schema...');
        await AppDataSource.synchronize();
        console.log('✅  Schema synchronized.');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash('password123', salt);

        const schoolRepo = AppDataSource.getRepository(School);
        const subRepo = AppDataSource.getRepository(Subscription);
        const userRepo = AppDataSource.getRepository(User);
        const staffRepo = AppDataSource.getRepository(Staff);
        const classRepo = AppDataSource.getRepository(SchoolClass);
        const studentRepo = AppDataSource.getRepository(Student);
        const subjectRepo = AppDataSource.getRepository(Subject);
        const gradingRepo = AppDataSource.getRepository(GradingRule);
        const darajaRepo = AppDataSource.getRepository(DarajaSetting);
        const platformRepo = AppDataSource.getRepository(PlatformSetting);

        let platformSettings = await platformRepo.findOne({ where: {} });
        if (!platformSettings) {
            platformSettings = platformRepo.create({
                basicMonthlyPrice: 3000,
                basicAnnualPrice: 30000,
                premiumMonthlyPrice: 5000,
                premiumAnnualPrice: 50000
            });
            await platformRepo.save(platformSettings);
        }

        let school = await schoolRepo.findOne({ where: { slug: 'springfield-elementary' } });
        if (!school) {
            const newSchool = schoolRepo.create({
                name: "Springfield Elementary",
                slug: "springfield-elementary",
                address: "123 Main St, Springfield",
                phone: "555-1234",
                email: "contact@springfield.edu",
                logoUrl: "https://i.imgur.com/pAEt4tQ.png",
                gradingSystem: GradingSystem.Traditional,
                schoolCode: 'SPE',
            });
            school = await schoolRepo.save(newSchool);

            const sub = subRepo.create({
                school: school,
                plan: SubscriptionPlan.PREMIUM,
                status: SubscriptionStatus.ACTIVE,
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            });
            await subRepo.save(sub);
            
            // Seed Default Traditional Grading Rubric (A-E)
            const rulesData = [
                { grade: 'A', minScore: 80, maxScore: 100 },
                { grade: 'B', minScore: 70, maxScore: 79 },
                { grade: 'C', minScore: 50, maxScore: 69 },
                { grade: 'D', minScore: 40, maxScore: 49 },
                { grade: 'E', minScore: 0, maxScore: 39 },
            ];

            for (const r of rulesData) {
                const rule = gradingRepo.create({
                    ...r,
                    school: school
                });
                await gradingRepo.save(rule);
            }
        }

        // Re-verify school is not null for the following operations
        if (!school) throw new Error("School could not be found or created.");

        const usersToCreate = [
            { name: 'Platform Owner', email: 'super@saaslink.com', role: Role.SuperAdmin, school: null },
            { name: 'Admin User', email: 'admin@saaslink.com', role: Role.Admin, school: school },
            { name: 'Accountant User', email: 'accountant@saaslink.com', role: Role.Accountant, school: school },
            { name: 'Alice Teacher', email: 'alice@saaslink.com', role: Role.Teacher, school: school },
            { name: 'Bob Teacher', email: 'bob@saaslink.com', role: Role.Teacher, school: school },
            { name: 'Charlie Parent', email: 'parent1@saaslink.com', role: Role.Parent, school: school },
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
                    school: userData.school ? { id: userData.school.id } as any : undefined,
                    status: 'Active',
                    avatarUrl: `https://i.pravatar.cc/150?u=${userData.email}`
                });
            } else {
                user.role = userData.role;
                user.school = userData.school ? { id: userData.school.id } as any : null;
                if (!user.password) user.password = hashedPassword;
            }
            const savedUser = await userRepo.save(user);
            createdUsers.push(savedUser);
        }

        const teacherUsers = createdUsers.filter(u => u.role === Role.Teacher);
        for (const teacher of teacherUsers) {
            const existing = await staffRepo.findOne({ where: { userId: teacher.id } });
            if (!existing) {
                const staffMember = staffRepo.create({
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
                await staffRepo.save(staffMember);
            }
        }

        const classNames = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
        const createdClasses: SchoolClass[] = [];
        
        for (let i = 0; i < classNames.length; i++) {
            let cls = await classRepo.findOne({ where: { name: classNames[i], school: { id: school.id } } });
            if (!cls) {
                const teacher = i < teacherUsers.length ? teacherUsers[i] : null;
                cls = classRepo.create({
                    name: classNames[i],
                    classCode: `G${i+1}`,
                    formTeacher: teacher,
                    school: school
                });
                cls = await classRepo.save(cls);
            }
            createdClasses.push(cls);
        }

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

        const subjectsData = [
            { name: 'Mathematics', code: 'MAT101' },
            { name: 'English Language', code: 'ENG202' },
            { name: 'Integrated Science', code: 'SCI303' },
            { name: 'Social Studies', code: 'SOS404' }
        ];
        for (const subjData of subjectsData) {
            let subj = await subjectRepo.findOne({ where: { name: subjData.name, school: { id: school.id } } });
            if (!subj) {
                subj = subjectRepo.create({ ...subjData, school });
                await subjectRepo.save(subj);
            }
        }

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
