/// <reference types="node" />
import process from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getDatabaseCredentials, loadEnvConfig } from '../config/env-loader';
import { 
    User, Role, Staff, SchoolClass, Student, StudentStatus, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, GradingSystem, DarajaSetting,
    School, Subscription, SubscriptionPlan, SubscriptionStatus,
    Book, LibraryTransaction, PlatformSetting, SubscriptionPayment, MonthlyFinancial, AuditLog
} from '../entities/all-entities';

loadEnvConfig();
const dbCreds = getDatabaseCredentials();

console.log('---------------------------------------------------------');
console.log('🌱  SAASLINK DATABASE SEEDER');
console.log(`📁  Active .env location: ${dbCreds.envFileUsed || 'Not found (using system environment)'}`);
console.log(`🌐  Target MySQL Host   : ${dbCreds.host}:${dbCreds.port}`);
console.log(`👤  Connecting as User  : ${dbCreds.username}`);
console.log(`🔑  Password Configured : ${dbCreds.password ? 'YES (length: ' + dbCreds.password.length + ' chars)' : 'NO / EMPTY'}`);
console.log(`🗄️   Target Database     : ${dbCreds.database}`);
console.log('---------------------------------------------------------');

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: dbCreds.host,
    port: dbCreds.port,
    username: dbCreds.username,
    password: dbCreds.password,
    database: dbCreds.database,
    entities: [
        User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
        Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
        GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
        Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
        SubscriptionPayment, MonthlyFinancial, AuditLog
    ],
    synchronize: true,
    dropSchema: false,
    logging: ['error'],
};

const AppDataSource = new DataSource(dataSourceOptions);

const runSeed = async () => {
    try {
        console.log('⏳ Connecting to database...');
        await AppDataSource.initialize();
        
        console.log('🔄 Ensuring Schema Synchronization...');
        await AppDataSource.synchronize();
        console.log('✅ Schema synchronized.');

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
        const settingRepo = AppDataSource.getRepository(SchoolSetting);
        const darajaRepo = AppDataSource.getRepository(DarajaSetting);
        const platformRepo = AppDataSource.getRepository(PlatformSetting);

        // 0. Seed Platform Settings if not exist
        let platformSetting = await platformRepo.findOne({ where: {} });
        if (!platformSetting) {
            platformSetting = platformRepo.create({
                allowRegistrations: true,
                maintenanceMode: false,
                requireEmailVerification: false,
                defaultCurrency: 'KES',
            });
            await platformRepo.save(platformSetting);
            console.log('Created default platform settings.');
        }

        // 1. Create Super Admin User
        let superAdmin = await userRepo.findOne({ where: { email: 'superadmin@saaslink.tech' } });
        if (!superAdmin) {
            superAdmin = userRepo.create({
                name: 'System Super Admin',
                email: 'superadmin@saaslink.tech',
                password: hashedPassword,
                role: Role.SuperAdmin,
            });
            await userRepo.save(superAdmin);
            console.log('Created Super Admin: superadmin@saaslink.tech / password123');
        }

        // 2. Create Default Demo School
        let school = await schoolRepo.findOne({ where: { slug: 'demo-academy' } });
        if (!school) {
            school = schoolRepo.create({
                name: 'Saaslink Model Academy',
                slug: 'demo-academy',
                email: 'admin@demoacademy.co.ke',
                phone: '+254712345678',
                address: 'Nairobi, Kenya',
                isActive: true
            });
            await schoolRepo.save(school);
            console.log('Created School: Saaslink Model Academy');
        }

        // 3. Create Active Subscription for School
        let subscription = await subRepo.findOne({ where: { school: { id: school.id } } });
        if (!subscription) {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            subscription = subRepo.create({
                plan: SubscriptionPlan.Pro,
                status: SubscriptionStatus.Active,
                billingCycle: 'annual',
                startDate: new Date(),
                endDate: endDate,
                school: school
            });
            await subRepo.save(subscription);
            console.log('Created Subscription: Active Pro Plan');
        }

        // 4. Create School Admin User
        let adminUser = await userRepo.findOne({ where: { email: 'admin@demoacademy.co.ke' } });
        if (!adminUser) {
            adminUser = userRepo.create({
                name: 'School Principal',
                email: 'admin@demoacademy.co.ke',
                password: hashedPassword,
                role: Role.Admin,
                school: school
            });
            await userRepo.save(adminUser);
            console.log('Created School Admin: admin@demoacademy.co.ke / password123');
        }

        // 5. Create Default School Settings
        let schoolSetting = await settingRepo.findOne({ where: { school: { id: school.id } } });
        if (!schoolSetting) {
            schoolSetting = settingRepo.create({
                name: school.name,
                address: school.address,
                phone: school.phone,
                email: school.email,
                currency: 'KES',
                academicYear: '2025/2026',
                term: 'Term 1',
                gradingSystem: GradingSystem.CBC,
                school: school
            });
            await settingRepo.save(schoolSetting);
        }

        // 6. Create Demo Classes
        const classesData = [
            { name: 'Grade 1 East', level: 1, capacity: 40 },
            { name: 'Grade 2 West', level: 2, capacity: 40 },
            { name: 'Grade 3 North', level: 3, capacity: 40 },
            { name: 'Grade 7 Delta (JSS)', level: 7, capacity: 45 },
            { name: 'Grade 8 Alpha (JSS)', level: 8, capacity: 45 },
        ];
        const createdClasses = [];
        for (const cls of classesData) {
            let schoolClass = await classRepo.findOne({ where: { name: cls.name, school: { id: school.id } } });
            if (!schoolClass) {
                schoolClass = classRepo.create({ ...cls, school });
                await classRepo.save(schoolClass);
            }
            createdClasses.push(schoolClass);
        }

        // 7. Create Staff Member
        let staff = await staffRepo.findOne({ where: { email: 'teacher@demoacademy.co.ke', school: { id: school.id } } });
        if (!staff) {
            staff = staffRepo.create({
                name: 'Jane Wanjiku',
                email: 'teacher@demoacademy.co.ke',
                phone: '0722000001',
                role: 'Senior Teacher',
                department: 'Languages',
                salary: 65000,
                status: 'Active',
                school: school
            });
            await staffRepo.save(staff);
            console.log('Created Staff: Jane Wanjiku (teacher@demoacademy.co.ke)');
        }

        // 8. Create Subjects
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

        // 9. Create Daraja / M-Pesa Settings placeholder
        let daraja = await darajaRepo.findOne({ where: { school: { id: school.id } } });
        if (!daraja) {
            daraja = darajaRepo.create({
                consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: '',
                school: school
            });
            await darajaRepo.save(daraja);
        }

        console.log('---------------------------------------------------------');
        console.log('🎉  [SUCCESS] Database seeded successfully!');
        console.log('🔑  Super Admin Login: superadmin@saaslink.tech  / password123');
        console.log('🏫  School Admin Login: admin@demoacademy.co.ke / password123');
        console.log('---------------------------------------------------------');

    } catch (error) {
        console.error('❌  [ERROR] Seeding failed:', error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
};

runSeed();
