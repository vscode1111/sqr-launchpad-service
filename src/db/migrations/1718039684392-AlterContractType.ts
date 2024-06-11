import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterContractType1718039684392 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const result: Object[] = await queryRunner.query(
      `select * from information_schema.tables where table_name = '_contracts'`,
    );

    if (result.length === 0) {
      return;
    }

    await queryRunner.query(`ALTER TYPE _contracts_type_enum ADD VALUE 'pro-rata'`);
    await queryRunner.query(`ALTER TYPE _contracts_type_enum ADD VALUE 'pro-rata-sqrp-gated'`);
  }

  public async down(): Promise<void> {}
}
