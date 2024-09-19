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

export const proRataTransactionItemType = ['deposit', 'refund'] as const;
export type ProRataTransactionItemType = (typeof proRataTransactionItemType)[number];

@Entity({ name: processDbTable.pro_rata_transaction_items })
export class ProRataTransactionItem  {
  @PrimaryGeneratedColumn()
  @Index()
  id!: number;

  @Index()
  @Column({ type: "int" })
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.proRataTransactionItems, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: P<ProRataTransactionItem>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @ManyToOne(() => Contract, (contract) => contract.contractTransactionItems,  { onDelete: 'CASCADE' })
  @JoinColumn([
    {
      name: P<ProRataTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Contract>((p) => p.networkId),
    },
    {
      name: P<ProRataTransactionItem>((p) => p.contract),
      referencedColumnName: P<Contract>((p) => p.address),
    }
  ])
  contract!: Contract;

  @Index()
  @Column({
    type: "enum",
    enum: proRataTransactionItemType,
  })
  type!: ProRataTransactionItemType;

  @ManyToOne(() => Account, (account) => account.accountTransactionItems, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: P<ProRataTransactionItem>((p) => p.account),
    referencedColumnName: P<Account>((p) => p.address),
  })
  account!: Account;

  @RelationId((p: ProRataTransactionItem) => p.account)
  accountAddress!: string;

  @Index()
  @Column({nullable: true})
  transactionId!: string;

  @Column({nullable: true})
  isSig!: boolean;

  @Index()
  @Column({ nullable: true })
  isBoost!: boolean;

  @Column({ type: "float" })
  baseAmount!: number;

  @Column({ type: "float" })
  boostAmount!: number;

  @Column({ type: "float", nullable: true })
  boostExchangeRate!: number;

  @Index()
  @Column({nullable: true})
  transactionHash!: string;

  @ManyToOne(() => Transaction)
  @JoinColumn([
    {
      name: P<ProRataTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Transaction>((p) => p.networkId),
    },
    {
      name: P<ProRataTransactionItem>((p) => p.transactionHash),
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

export const CProRataTransactionItem = C(ProRataTransactionItem);
export const NProRataTransactionItem = NF<ProRataTransactionItem>();
export const PProRataTransactionItem = NF2<ProRataTransactionItem>((name) => `${CProRataTransactionItem}.${name}`);
