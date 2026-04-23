import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToUsers1775374830748 implements MigrationInterface {
  name = 'AddEmailToUsers1775374830748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const userColumns = (await queryRunner.query(
      "SHOW COLUMNS FROM `users` LIKE 'email'",
    )) as any[];
    
    if (userColumns.length === 0) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `email` varchar(255) NULL',
      );
      // Add unique index separately to be safe across MySQL versions
      await queryRunner.query(
        'ALTER TABLE `users` ADD UNIQUE INDEX `UQ_users_email` (`email`)',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userColumns = (await queryRunner.query(
      "SHOW COLUMNS FROM `users` LIKE 'email'",
    )) as any[];
    
    if (userColumns.length > 0) {
      await queryRunner.query('ALTER TABLE `users` DROP INDEX `UQ_users_email`');
      await queryRunner.query('ALTER TABLE `users` DROP COLUMN `email`');
    }
  }
}
