import { MigrationInterface, QueryRunner } from 'typeorm';

export class TruncateProRataTransactionItems1720431525423 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE pro_rata_transaction_items;`);
  }

  public async down(): Promise<void> {}
}
