import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { C, NF2, P } from "~common";
import { rawDbTable } from "~db/tableNames";
import { TransactionItem } from "../process";
import { Block } from "./Block";
import { Event } from "./Event";
import { Network } from "./Network";

@Entity({ name: rawDbTable._transactions })
@Index([P<Transaction>((p) => p.networkId) as string, P<Transaction>((p) => p.hash) as string], {
  unique: true,
})
export class Transaction {
  @Column()
  @Index()
  networkId!: number;

  @ManyToOne(() => Network)
  @JoinColumn({
    name: P<Transaction>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @PrimaryColumn()
  hash!: string;

  @Column()
  transactionIndex!: number;

  @Column()
  @Index()
  blockNumber!: number;

  @ManyToOne(() => Block, (block) => block.transactions)
  @JoinColumn({
    name: P<Transaction>((p) => p.blockNumber),
    referencedColumnName: P<Block>((p) => p.number),
  })
  block!: Block;

  @Column()
  from!: string;

  @Column({ type: "varchar", nullable: true })
  to!: string | null;

  @Column({ type: "float" })
  gas!: number;

  @Column({ type: "float" })
  gasPrice!: number;

  @Column({ type: "text" })
  input!: string;

  @Column()
  nonce!: number;

  @Column({ type: "float" })
  value!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Event, (event) => event.transactionHash)
  events!: Event[];

  @OneToMany(() => TransactionItem, (transactionItem) => transactionItem.transaction)
  transactionItems!: TransactionItem[]; 
}

export const CTransaction = C(Transaction);
export const PTransaction = NF2<Transaction>((name) => `${CTransaction}.${name}`);
