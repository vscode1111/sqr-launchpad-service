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

@Entity({ name: processDbTable.payment_gateway_transaction_items })
export class PaymentGatewayTransactionItem  {
  @PrimaryGeneratedColumn()
  @Index()
  id!: number;

  @Index()
  @Column({ type: "int" })
  networkId!: number;

  @ManyToOne(() => Network, (network) => network.paymentGatewayTransactionItems)
  @JoinColumn({
    name: P<PaymentGatewayTransactionItem>((p) => p.networkId),
    referencedColumnName: P<Network>((p) => p.id),
  })
  network!: Network;

  @ManyToOne(() => Contract, (contract) => contract.contractTransactionItems)
  @JoinColumn([
    {
      name: P<PaymentGatewayTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Contract>((p) => p.networkId),
    },
    {
      name: P<PaymentGatewayTransactionItem>((p) => p.contract),
      referencedColumnName: P<Contract>((p) => p.address),
    }
  ])
  contract!: Contract;

  @ManyToOne(() => Account, (account) => account.accountTransactionItems)
  @JoinColumn({
    name: P<PaymentGatewayTransactionItem>((p) => p.account),
    referencedColumnName: P<Account>((p) => p.address),
  })
  account!: Account;

  @RelationId((p: PaymentGatewayTransactionItem) => p.account)
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
      name: P<PaymentGatewayTransactionItem>((p) => p.networkId),
      referencedColumnName: P<Transaction>((p) => p.networkId),
    },
    {
      name: P<PaymentGatewayTransactionItem>((p) => p.transactionHash),
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

export const CPaymentGatewayTransactionItem = C(PaymentGatewayTransactionItem);
export const NPaymentGatewayTransactionItem = NF<PaymentGatewayTransactionItem>();
export const PPaymentGatewayTransactionItem = NF2<PaymentGatewayTransactionItem>((name) => `${CPaymentGatewayTransactionItem}.${name}`);
