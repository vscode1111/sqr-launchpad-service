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

export const vestingTransactionItemType = ['claim', 'refund'] as const;
export type VestingTransactionItemType = (typeof vestingTransactionItemType)[number];
const DEFAULT_VESTING_TYPE: VestingTransactionItemType = 'claim';

@Entity({ name: processDbTable.vesting_transaction_items })
export class VestingTransactionItem  {
  @PrimaryGeneratedColumn()
  @Index()
  id!: number;

  @Index()
  @Column({ type: "int" })
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.vestingTransactionItems, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: P<VestingTransactionItem>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @ManyToOne(() => Contract, (contract) => contract.contractTransactionItems, { onDelete: 'CASCADE' })
  @JoinColumn([
    {
      name: P<VestingTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Contract>((p) => p.networkId),
    },
    {
      name: P<VestingTransactionItem>((p) => p.contract),
      referencedColumnName: P<Contract>((p) => p.address),
    }
  ])
  contract!: Contract;

  @Index()
  @Column({
    type: "enum",
    default: DEFAULT_VESTING_TYPE,
    enum: vestingTransactionItemType,
  })
  type!: VestingTransactionItemType;

  @ManyToOne(() => Account, (account) => account.accountTransactionItems, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: P<VestingTransactionItem>((p) => p.account),
    referencedColumnName: P<Account>((p) => p.address),
  })
  account!: Account;

  @RelationId((p: VestingTransactionItem) => p.account)
  accountAddress!: string;

  @Column({ type: "float", nullable: true })
  amount!: number;

  @Index()
  @Column({ nullable: true })
  transactionHash!: string;

  @ManyToOne(() => Transaction)
  @JoinColumn([
    {
      name: P<VestingTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Transaction>((p) => p.networkId),
    },
    {
      name: P<VestingTransactionItem>((p) => p.transactionHash),
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

export const CVestingTransactionItem = C(VestingTransactionItem);
export const NVestingTransactionItem = NF<VestingTransactionItem>();
export const PVestingTransactionItem = NF2<VestingTransactionItem>((name) => `${CVestingTransactionItem}.${name}`);
