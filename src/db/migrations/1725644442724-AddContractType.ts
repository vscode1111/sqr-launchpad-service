import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractType1725644442724 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE _contracts_type_enum ADD VALUE 'payment-gateway';
   `);
  }

  public async down(): Promise<void> {}
}
