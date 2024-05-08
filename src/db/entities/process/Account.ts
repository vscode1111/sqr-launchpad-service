import { CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { C, NF2 } from "~common";
import { processDbTable } from "../../tableNames";
import { PaymentGatewayTransactionItem } from "./PaymentGatewayTransactionItem";

@Entity({ name: processDbTable.accounts })
export class Account {
  @PrimaryColumn()
  address!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PaymentGatewayTransactionItem, (item) => item.account)
  accountTransactionItems!: PaymentGatewayTransactionItem[];
}

export const CAccount = C(Account);
export const PAccount = NF2<Account>((name) => `${CAccount}.${name}`);
