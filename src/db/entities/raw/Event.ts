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
import { rawDbTable } from "../../tableNames";
import { Contract } from "./Contract";
import { Network } from "./Network";
import { Transaction } from "./Transaction";

@Entity({ name: rawDbTable._events })
export class Event {
  @Column()
  @Index()
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.blocks)
  @JoinColumn({
    name: P<Event>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

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
