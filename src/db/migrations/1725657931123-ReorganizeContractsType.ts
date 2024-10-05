import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReorganizeContractsType1725657931123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE _contracts SET type = 'payment-gateway' WHERE type = 'fcfs';
      UPDATE _contracts SET type = 'payment-gateway' WHERE type = 'web3-gated';
      UPDATE _contracts SET type = 'payment-gateway' WHERE type = 'white-list';
      UPDATE _contracts SET type = 'pro-rata' WHERE type = 'pro-rata-web3-gated';

      ALTER TYPE _contracts_type_enum RENAME TO _contracts_type_enum_old;
      CREATE TYPE _contracts_type_enum AS ENUM('payment-gateway', 'pro-rata', 'vesting', 'babt');
      ALTER TABLE _contracts alter column type DROP DEFAULT;
      ALTER TABLE _contracts ALTER COLUMN type TYPE _contracts_type_enum USING type::text::_contracts_type_enum;
      DROP TYPE _contracts_type_enum_old;
  `);
  }

  public async down(): Promise<void> {}
}
