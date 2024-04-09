import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from "typeorm";
import { C, NF2, P } from "~common";
import { rawDbTable } from "~db/tableNames";
import { Network } from "./Network";
import { Transaction } from "./Transaction";

@Entity({ name: rawDbTable._blocks })
export class Block {
  @Column()
  @Index()
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.blocks)
  @JoinColumn({
    name: P<Block>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @PrimaryColumn()
  number!: number;

  @Column()
  hash!: string;

  @Column()
  timestamp!: Date;

  @OneToMany(() => Transaction, (item) => item.blockNumber)
  transactions!: Transaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const CBlock = C(Block);

export const PBlock = NF2<Block>((name) => `${CBlock}.${name}`);
