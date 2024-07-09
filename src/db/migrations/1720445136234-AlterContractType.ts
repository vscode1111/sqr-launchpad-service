import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterContractType1718039684392 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE _contracts_type_enum ADD VALUE 'babt'`);
  }

  public async down(): Promise<void> { }
}
