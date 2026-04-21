import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1774374830746 implements MigrationInterface {
    name = 'InitialMigration1774374830746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Tenants
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `tenants` (`id` varchar(255) PRIMARY KEY NOT NULL, `name` varchar(255) NOT NULL, `domain` varchar(255) NOT NULL, `plan` varchar(255) NOT NULL DEFAULT 'free', `subscriptionStatus` varchar(255) NOT NULL DEFAULT 'active', `expiresAt` datetime, `stripe_customer_id` varchar(255), `gradingMode` varchar(255) NOT NULL DEFAULT 'TRADITIONAL', UNIQUE INDEX `UQ_tenants_name` (`name`)) ENGINE=InnoDB");
        
        // Ensure missing columns exist in tenants (if table was created without them)
        const columns = await queryRunner.query("SHOW COLUMNS FROM `tenants` LIKE 'gradingMode'");
        if (columns.length === 0) {
            await queryRunner.query("ALTER TABLE `tenants` ADD COLUMN `gradingMode` varchar(255) NOT NULL DEFAULT 'TRADITIONAL'");
        }

        // Users
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `users` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `username` varchar(255) NOT NULL, `password_hash` varchar(255) NOT NULL, `password_reset_token` varchar(255), `password_reset_expires` datetime, `role` varchar(255) NOT NULL DEFAULT 'parent', UNIQUE INDEX `UQ_users_username` (`username`)) ENGINE=InnoDB");

        // Permissions
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `permissions` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `description` varchar(255)) ENGINE=InnoDB");

        // Role Permissions
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `role_permissions` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `role` varchar(255) NOT NULL, `permissionId` varchar(255) NOT NULL) ENGINE=InnoDB");

        // Sections
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `sections` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `classLevelId` varchar(255) NOT NULL, `room` varchar(255), `classTeacherId` varchar(255), `academicYearId` varchar(255)) ENGINE=InnoDB");
        const sectionColumns = await queryRunner.query("SHOW COLUMNS FROM `sections` LIKE 'classTeacherId'");
        if (sectionColumns.length === 0) {
            await queryRunner.query("ALTER TABLE `sections` ADD COLUMN `classTeacherId` varchar(255), ADD COLUMN `academicYearId` varchar(255)");
        }

        // Class Levels
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `class_levels` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `description` varchar(255), `headTeacherId` varchar(255), `academicYearId` varchar(255)) ENGINE=InnoDB");
        const classLevelColumns = await queryRunner.query("SHOW COLUMNS FROM `class_levels` LIKE 'headTeacherId'");
        if (classLevelColumns.length === 0) {
            await queryRunner.query("ALTER TABLE `class_levels` ADD COLUMN `headTeacherId` varchar(255), ADD COLUMN `academicYearId` varchar(255)");
        }

        // Academic Years
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `academic_years` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `startDate` date NOT NULL, `endDate` date NOT NULL, `isCurrent` tinyint(1) NOT NULL DEFAULT 0) ENGINE=InnoDB");

        // Students
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `students` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `firstName` varchar(255) NOT NULL, `lastName` varchar(255) NOT NULL, `registrationNumber` varchar(255), `classLevelId` varchar(255), `sectionId` varchar(255), `academicYearId` varchar(255), `status` varchar(255) NOT NULL DEFAULT 'Active', `parentId` varchar(255)) ENGINE=InnoDB");

        // Staff
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `staff` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `firstName` varchar(255) NOT NULL, `lastName` varchar(255) NOT NULL, `role` varchar(255) NOT NULL, `email` varchar(255) NOT NULL, `phone` varchar(255), UNIQUE INDEX `UQ_staff_email` (`email`)) ENGINE=InnoDB");

        // Subjects
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `subjects` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `classLevel` varchar(255) NOT NULL, `teacherId` varchar(255)) ENGINE=InnoDB");

        // Attendance
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `attendance` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `studentId` varchar(255) NOT NULL, `classLevelId` varchar(255) NOT NULL, `date` datetime NOT NULL, `status` varchar(255) NOT NULL) ENGINE=InnoDB");

        // Fees
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `fees` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `studentId` varchar(255) NOT NULL, `amount` decimal(10,2) NOT NULL, `dueDate` datetime NOT NULL, `status` varchar(255) NOT NULL DEFAULT 'unpaid') ENGINE=InnoDB");

        // Expenses
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `expenses` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `category` varchar(255) NOT NULL, `amount` decimal(10,2) NOT NULL, `date` datetime NOT NULL, `description` varchar(255)) ENGINE=InnoDB");

        // Examinations
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `examinations` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `subjectId` varchar(255) NOT NULL, `date` datetime NOT NULL, `totalMarks` decimal(5,2) NOT NULL) ENGINE=InnoDB");

        // Report Cards
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `report_cards` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `studentId` varchar(255) NOT NULL, `examinationId` varchar(255) NOT NULL, `marks` decimal(5,2) NOT NULL, `grade` varchar(255), `remarks` varchar(255)) ENGINE=InnoDB");

        // Payroll
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `payrolls` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `staffId` varchar(255) NOT NULL, `salary` decimal(10,2) NOT NULL, `payDate` datetime NOT NULL, `status` varchar(255) NOT NULL DEFAULT 'unpaid') ENGINE=InnoDB");

        // Timetable Entries
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `timetable_entries` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `classLevel` varchar(255) NOT NULL, `dayOfWeek` varchar(255) NOT NULL, `startTime` varchar(255) NOT NULL, `endTime` varchar(255) NOT NULL, `subjectId` varchar(255) NOT NULL, `teacherId` varchar(255) NOT NULL) ENGINE=InnoDB");

        // Calendar Events
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `calendar_events` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `title` varchar(255) NOT NULL, `start` datetime NOT NULL, `end` datetime NOT NULL, `description` varchar(255)) ENGINE=InnoDB");

        // Audit Logs
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `audit_logs` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255), `userId` varchar(255) NOT NULL, `action` varchar(255) NOT NULL, `entity` varchar(255) NOT NULL, `entityId` varchar(255), `oldValue` text, `newValue` text, `ipAddress` varchar(255), `userAgent` varchar(255), `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");

        // Messages
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `messages` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `senderId` varchar(255) NOT NULL, `recipientId` varchar(255) NOT NULL, `content` text NOT NULL, `sentAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");

        // Library Books
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `books` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `title` varchar(255) NOT NULL, `author` varchar(255) NOT NULL, `isbn` varchar(255), `status` varchar(255) NOT NULL DEFAULT 'available') ENGINE=InnoDB");

        // Subscription Plans
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `subscription_plans` (`id` varchar(255) PRIMARY KEY NOT NULL, `name` varchar(255) NOT NULL, `description` varchar(255) NOT NULL, `price` int NOT NULL, `interval` varchar(255) NOT NULL DEFAULT 'month', `stripePriceId` varchar(255) NOT NULL, `features` text NOT NULL, `isActive` tinyint(1) NOT NULL DEFAULT 1, UNIQUE INDEX `UQ_subscription_plans_name` (`name`)) ENGINE=InnoDB");

        // Pending Payments
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `pending_payments` (`id` varchar(255) PRIMARY KEY NOT NULL, `amount` int NOT NULL, `method` varchar(255) NOT NULL, `reference` varchar(255) NOT NULL, `plan` varchar(255), `isApproved` tinyint(1) NOT NULL DEFAULT 0, `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `tenantId` varchar(255)) ENGINE=InnoDB");

        // LMS Connections
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `lms_connections` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `provider` varchar(255) NOT NULL, `apiUrl` varchar(255) NOT NULL, `encrypted_credential_1` varchar(255) NOT NULL, `encrypted_credential_2` varchar(255), `encrypted_refresh_token` varchar(255), `isConnected` tinyint(1) NOT NULL DEFAULT 0, UNIQUE INDEX `IDX_lms_connections_tenant_provider` (`tenantId`, `provider`)) ENGINE=InnoDB");

        // Grading Scales
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `grading_scales` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `grade` varchar(255) NOT NULL, `minMark` decimal(5,2) NOT NULL, `maxMark` decimal(5,2) NOT NULL, `gradePoint` decimal(5,2) NOT NULL, `remarks` varchar(255)) ENGINE=InnoDB");

        // System Config
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `system_config` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `key` varchar(255) NOT NULL, `value` text NOT NULL, UNIQUE INDEX `IDX_system_config_tenant_key` (`tenantId`, `key`)) ENGINE=InnoDB");

        // CBE Entities
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `cbe_competencies` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `subjectId` varchar(255) NOT NULL, `code` varchar(255) NOT NULL, `description` text NOT NULL) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `cbe_rubrics` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `description` text, `level` int NOT NULL, `score` int NOT NULL) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE IF NOT EXISTS `cbe_assessments` (`id` varchar(255) PRIMARY KEY NOT NULL, `tenantId` varchar(255) NOT NULL, `studentId` varchar(255) NOT NULL, `competencyId` varchar(255) NOT NULL, `rubricId` varchar(255) NOT NULL, `assessmentDate` datetime NOT NULL, `comments` text, `academicYearId` varchar(255) NOT NULL) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `cbe_assessments`")
        await queryRunner.query("DROP TABLE `cbe_rubrics`")
        await queryRunner.query("DROP TABLE `cbe_competencies`")
        await queryRunner.query("DROP TABLE `system_config`")
        await queryRunner.query("DROP TABLE `grading_scales`")
        await queryRunner.query("DROP TABLE `lms_connections`")
        await queryRunner.query("DROP TABLE `pending_payments`")
        await queryRunner.query("DROP TABLE `subscription_plans`")
        await queryRunner.query("DROP TABLE `books`")
        await queryRunner.query("DROP TABLE `messages`")
        await queryRunner.query("DROP TABLE `audit_logs`")
        await queryRunner.query("DROP TABLE `calendar_events`")
        await queryRunner.query("DROP TABLE `timetable_entries`")
        await queryRunner.query("DROP TABLE `payrolls`")
        await queryRunner.query("DROP TABLE `report_cards`")
        await queryRunner.query("DROP TABLE `examinations`")
        await queryRunner.query("DROP TABLE `expenses`")
        await queryRunner.query("DROP TABLE `fees`")
        await queryRunner.query("DROP TABLE `attendance`")
        await queryRunner.query("DROP TABLE `subjects`")
        await queryRunner.query("DROP TABLE `staff`")
        await queryRunner.query("DROP TABLE `students`")
        await queryRunner.query("DROP TABLE `academic_years`")
        await queryRunner.query("DROP TABLE `class_levels`")
        await queryRunner.query("DROP TABLE `sections`")
        await queryRunner.query("DROP TABLE `role_permissions`")
        await queryRunner.query("DROP TABLE `permissions`")
        await queryRunner.query("DROP TABLE `users`")
        await queryRunner.query("DROP TABLE `tenants`")
    }
}
