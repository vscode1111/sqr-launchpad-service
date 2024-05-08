import { MigrationInterface, QueryRunner } from 'typeorm';
import { dbHardReset } from '../utils';

const EXECUTE = true;

export class HardReset1715202251990 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (EXECUTE) {
      await dbHardReset(queryRunner);
    }
  }

  public async down(): Promise<void> {}
}
