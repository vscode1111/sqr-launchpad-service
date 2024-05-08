import { MigrationInterface, QueryRunner } from 'typeorm';
import { dbHardReset } from '../utils';

export class HardReset1715202251990 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await dbHardReset(queryRunner);
  }

  public async down(): Promise<void> {}
}
