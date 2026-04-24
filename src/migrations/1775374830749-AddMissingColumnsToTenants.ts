import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToTenants1775374830749 implements MigrationInterface {
  name = 'AddMissingColumnsToTenants1775374830749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "SHOW COLUMNS FROM `tenants`"
    )) as any[];
    
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('contactEmail')) {
      await queryRunner.query(
        'ALTER TABLE `tenants` ADD COLUMN `contactEmail` varchar(255) NULL',
      );
    }

    if (!columnNames.includes('subscriptionFee')) {
      await queryRunner.query(
        'ALTER TABLE `tenants` ADD COLUMN `subscriptionFee` decimal(10,2) NOT NULL DEFAULT 0.00',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "SHOW COLUMNS FROM `tenants`"
    )) as any[];
    
    const columnNames = columns.map(c => c.Field);

    if (columnNames.includes('contactEmail')) {
      await queryRunner.query('ALTER TABLE `tenants` DROP COLUMN `contactEmail`');
    }

    if (columnNames.includes('subscriptionFee')) {
      await queryRunner.query('ALTER TABLE `tenants` DROP COLUMN `subscriptionFee`');
    }
  }
}
