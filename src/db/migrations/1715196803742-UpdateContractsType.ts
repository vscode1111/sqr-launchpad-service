import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContractsType1715196803742 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE _contracts_type_enum ADD VALUE IF NOT EXISTS 'vesting'`);
    await queryRunner.query(`DROP TABLE IF EXISTS transaction_items`);
  }

  public async down(): Promise<void> {}
}
