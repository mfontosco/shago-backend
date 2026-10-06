import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('payments')
@Index(['tenant_id'])
@Index(['order_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('uuid')
  order_id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column('varchar', { length: 100, nullable: true })
  customer_name: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('varchar', { length: 3, default: 'GHS' })
  currency: string;

  @Column('enum', { enum: ['card', 'bank_transfer', 'wallet', 'cash', 'other'], default: 'card' })
  payment_method: string;

  @Column('enum', { enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'], default: 'pending' })
  payment_status: string;

  @Column('varchar', { length: 255, nullable: true })
  transaction_reference: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
