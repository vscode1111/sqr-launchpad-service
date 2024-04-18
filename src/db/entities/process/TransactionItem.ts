import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn
} from "typeorm";
import { C, NF, NF2, P } from "~common";
import { processDbTable } from "~db/tableNames";
import { Contract, Network, Transaction } from "../raw";
import { Account } from "./Account";

export const transactionItemTypes = ['deposit'] as const;
export type TransactionItemType = (typeof transactionItemTypes)[number];

@Entity({ name: processDbTable.transaction_items })
export class TransactionItem  {
  @PrimaryGeneratedColumn()
  @Index()
  id!: number;

  @Index()
  @Column({ type: "int" })
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.transactionItems)
  @JoinColumn({
    name: P<TransactionItem>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @ManyToOne(() => Contract, (contract) => contract.contractTransactionItems)
  @JoinColumn([
    {
      name: P<TransactionItem>((p) => p.networkId),
      referencedColumnName: P<Contract>((p) => p.networkId),
    },
    {
      name: P<TransactionItem>((p) => p.contract),
      referencedColumnName: P<Contract>((p) => p.address),
    }
  ])
  contract!: Contract;

  @Column({
    nullable: true,
    type: "enum",
    enum: transactionItemTypes,
  })
  type!: TransactionItemType;

  @ManyToOne(() => Account, (account) => account.accountTransactionItems)
  @JoinColumn({
    name: P<TransactionItem>((p) => p.account),
    referencedColumnName: P<Account>((p) => p.address),
  })
  account!: Account;

  @RelationId((p: TransactionItem) => p.account)
  accountAddress!: string;

  @Index()
  @Column()
  userId!: string;

  @Index()
  @Column()
  transactionId!: string;

  @Column()
  isSig!: boolean;

  @Column({ type: "float" })
  amount!: number;

  @Index()
  @Column({nullable: true})
  transactionHash!: string;

  @ManyToOne(() => Transaction)
  @JoinColumn([
    {
      name: P<TransactionItem>((p) => p.networkId),
      referencedColumnName: P<Transaction>((p) => p.networkId),
    },
    {
      name: P<TransactionItem>((p) => p.transactionHash),
      referencedColumnName: P<Transaction>((p) => p.hash),
    },
  ])
  transaction!: Transaction;

  @Column()
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const CTransactionItem = C(TransactionItem);
export const NTransactionItem = NF<TransactionItem>();
export const PTransactionItem = NF2<TransactionItem>((name) => `${CTransactionItem}.${name}`);
