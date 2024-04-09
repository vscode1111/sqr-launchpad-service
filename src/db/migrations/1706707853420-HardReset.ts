import { MigrationInterface, QueryRunner } from 'typeorm';
import { dbHardReset } from '../utils';

export class HardReset1706707853420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await dbHardReset(queryRunner);
  }

  public async down(): Promise<void> {}
}
