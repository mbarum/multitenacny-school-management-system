/// <reference types="node" />
import process from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getDatabaseCredentials, loadEnvConfig } from '../config/env-loader';
import { 
    User, Role, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, 
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
        const subjectRepo = AppDataSource.getRepository(Subject);
        const settingRepo = AppDataSource.getRepository(SchoolSetting);
        const darajaRepo = AppDataSource.getRepository(DarajaSetting);
        const platformRepo = AppDataSource.getRepository(PlatformSetting);

        // 0. Seed Platform Settings if not exist
        let platformSetting = await platformRepo.findOne({ where: {} });
        if (!platformSetting) {
            platformSetting = platformRepo.create({
                basicMonthlyPrice: 3000,
                basicAnnualPrice: 30000,
                premiumMonthlyPrice: 5000,
                premiumAnnualPrice: 50000,
            });
            await platformRepo.save(platformSetting);
            console.log('Created default platform settings.');
        }

        // 1. Create Super Admin Users
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

        let superAdminAlt = await userRepo.findOne({ where: { email: 'super@saaslink.com' } });
        if (!superAdminAlt) {
            superAdminAlt = userRepo.create({
                name: 'Platform Owner',
                email: 'super@saaslink.com',
                password: hashedPassword,
                role: Role.SuperAdmin,
            });
            await userRepo.save(superAdminAlt);
            console.log('Created Super Admin: super@saaslink.com / password123');
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
                schoolCode: 'SMA01',
                currency: 'KES',
                gradingSystem: GradingSystem.CBC,
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
                plan: SubscriptionPlan.PREMIUM,
                status: SubscriptionStatus.ACTIVE,
                billingCycle: 'ANNUALLY',
                startDate: new Date(),
                endDate: endDate,
                school: school,
            });
            await subRepo.save(subscription);
            console.log('Created Subscription: Active Premium Plan');
        }

        // 4. Create School Admin Users
        let adminUser = await userRepo.findOne({ where: { email: 'admin@demoacademy.co.ke' } });
        if (!adminUser) {
            adminUser = userRepo.create({
                name: 'School Principal',
                email: 'admin@demoacademy.co.ke',
                password: hashedPassword,
                role: Role.Admin,
                school: school,
            });
            await userRepo.save(adminUser);
            console.log('Created School Admin: admin@demoacademy.co.ke / password123');
        }

        let adminUserAlt = await userRepo.findOne({ where: { email: 'admin@saaslink.com' } });
        if (!adminUserAlt) {
            adminUserAlt = userRepo.create({
                name: 'School Admin',
                email: 'admin@saaslink.com',
                password: hashedPassword,
                role: Role.Admin,
                school: school,
            });
            await userRepo.save(adminUserAlt);
            console.log('Created School Admin: admin@saaslink.com / password123');
        }

        // 5. Seed SchoolSetting
        let schoolSetting = await settingRepo.findOne({ where: { name: school.name } });
        if (!schoolSetting) {
            schoolSetting = settingRepo.create({
                name: school.name,
                address: school.address || 'Nairobi, Kenya',
                phone: school.phone || '+254712345678',
                email: school.email || 'admin@demoacademy.co.ke',
                schoolCode: 'SMA01',
                gradingSystem: GradingSystem.CBC,
            });
            await settingRepo.save(schoolSetting);
            console.log('Created School Setting record.');
        }

        // 6. Create Demo Classes
        const classesData = [
            { name: 'Grade 1 East', classCode: 'G1E' },
            { name: 'Grade 2 West', classCode: 'G2W' },
            { name: 'Grade 3 North', classCode: 'G3N' },
            { name: 'Grade 7 Delta (JSS)', classCode: 'G7D' },
            { name: 'Grade 8 Alpha (JSS)', classCode: 'G8A' },
        ];
        for (const cls of classesData) {
            let schoolClass = await classRepo.findOne({ 
                where: { 
                    name: cls.name, 
                    school: { id: school.id } 
                } 
            });
            if (!schoolClass) {
                schoolClass = classRepo.create({
                    name: cls.name,
                    classCode: cls.classCode,
                    school: school,
                });
                await classRepo.save(schoolClass);
            }
        }
        console.log('Created demo classes.');

        // 7. Create Staff Member
        let staff = await staffRepo.findOne({ where: { name: 'Jane Wanjiku', school: { id: school.id } } });
        if (!staff) {
            staff = staffRepo.create({
                name: 'Jane Wanjiku',
                role: 'Senior Teacher',
                salary: 65000,
                joinDate: '2024-01-10',
                school: school,
            });
            await staffRepo.save(staff);
            console.log('Created Staff: Jane Wanjiku');
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
        console.log('Created demo subjects.');

        // 9. Create Daraja / M-Pesa Settings placeholder
        let daraja = await darajaRepo.findOne({ where: { school: { id: school.id } } });
        if (!daraja) {
            daraja = darajaRepo.create({
                consumerKey: '', 
                consumerSecret: '', 
                shortCode: '', 
                passkey: '', 
                paybillNumber: '',
                environment: 'sandbox',
                school: school,
            });
            await darajaRepo.save(daraja);
            console.log('Created Daraja/M-Pesa placeholder config.');
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
