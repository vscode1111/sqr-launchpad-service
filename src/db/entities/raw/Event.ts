import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { C, NF2, P } from "~common";
import { rawDbTable } from "~db/tableNames";
import { Contract } from "./Contract";
import { Transaction } from "./Transaction";

@Entity({ name: rawDbTable._events })
export class Event {
  @PrimaryColumn()
  @Index()
  @ManyToOne(() => Transaction, (transaction) => transaction.events)
  @JoinColumn({
    name: P<Event>((p) => p.transactionHash),
    referencedColumnName: P<Transaction>((p) => p.hash),
  })
  transactionHash!: Transaction;

  @PrimaryColumn()
  @Index()
  topic0!: string;

  @Column({ nullable: true })
  @Index()
  topic1!: string;

  @Column({ nullable: true })
  @Index()
  topic2!: string;

  @Column({ nullable: true })
  @Index()
  topic3!: string;

  @Column({ type: "text", nullable: true })
  data!: string | undefined;

  @Column()
  transactionIndex!: number;

  @Column()
  @Index()
  contractId!: string;

  @ManyToOne(() => Contract, (contract) => contract.events)
  @JoinColumn({
    name: P<Event>((p) => p.contractId),
    referencedColumnName: P<Contract>((p) => p.id),
  })
  contract!: Contract;

  @Column()
  logIndex!: number;

  @Column()
  removed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const CEvent = C(Event);
export const PEvent = NF2<Event>((name) => `${CEvent}.${name}`);
