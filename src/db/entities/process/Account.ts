import { CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { C, NF2 } from "~common";
import { processDbTable } from "../../tableNames";
import { TransactionItem } from "./TransactionItem";

@Entity({ name: processDbTable.accounts })
export class Account {
  @PrimaryColumn()
  address!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TransactionItem, (item) => item.account)
  accountTransactionItems!: TransactionItem[];
}

export const CAccount = C(Account);
export const PAccount = NF2<Account>((name) => `${CAccount}.${name}`);
