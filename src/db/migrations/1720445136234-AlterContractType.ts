import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterContractType1720445136234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE _contracts_type_enum ADD VALUE 'babt'`);
  }

  public async down(): Promise<void> { }
}
