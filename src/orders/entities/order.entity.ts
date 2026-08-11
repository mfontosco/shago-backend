import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entities';
import { OrderItem } from './order-item.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Order Entity - Represents a customer order
 *
 * Tracks:
 * - Order status (pending → confirmed → shipped → delivered)
 * - Customer information
 * - Delivery details
 * - Payment information
 * - Items in order
 *
 * Multi-tenancy: tenant_id ensures vendor data isolation
 *
 * Used by:
 * - Vendor Orders page (list, details, status update)
 * - Dashboard page (total orders, stats)
 * - Delivery page (assign riders)
 * - Reports page (revenue, trends)
 */
@Entity('orders')
@Index(['tenant_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'created_at'])
@Index(['user_id'])
@Index(['status'])
@Index(['created_at'])
@Index(['status', 'created_at'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← CRITICAL: Which vendor owns this order?

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Customer who placed the order
   * FK to users table
   */
  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  user_id: string;

  /**
   * Order status workflow
   * pending → confirmed → shipped → delivered → completed
   * or → cancelled at any stage
   */
  @Column({
    type: 'enum',
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'shipped',
      'in_transit',
      'delivered',
      'completed',
      'cancelled',
    ],
    default: 'pending',
  })
  status: OrderStatus;

  /**
   * Order items (products ordered)
   * One-to-many relationship with OrderItem
   */
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  /**
   * Total order amount (before discounts)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  /**
   * Discount amount (if any)
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  /**
   * Delivery fee
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  delivery_fee: number;

  /**
   * Total amount (subtotal - discount + delivery_fee)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  total_price: number;

  /**
   * Delivery address
   */
  @Column('text')
  delivery_address: string;

  /**
   * Latitude/Longitude for delivery location
   */
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  delivery_latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  delivery_longitude: number;

  /**
   * Payment method
   */
  @Column({
    type: 'enum',
    enum: ['credit_card', 'debit_card', 'cash', 'wallet', 'bank_transfer'],
    default: 'cash',
  })
  payment_method: PaymentMethod;

  /**
   * Special instructions for delivery/order
   */
  @Column({ type: 'text', nullable: true })
  special_instructions: string;

  /**
   * Estimated delivery time (in minutes)
   */
  @Column({ type: 'integer', nullable: true })
  estimated_delivery_time: number;

  /**
   * Actual delivery time (when delivered)
   */
  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  /**
   * Rider assigned to this order
   */
  @Column({ nullable: true })
  rider_id: string;

  /**
   * When order was created
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * When order was last updated
   */
  @UpdateDateColumn()
  updated_at: Date;

  /**
   * When order was soft deleted (cancelled, returned, etc.)
   */
  @DeleteDateColumn()
  deleted_at: Date;

  /**
   * Helper: Calculate total number of items
   */
  getTotalItems(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  /**
   * Helper: Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return ['pending', 'confirmed'].includes(this.status);
  }

  /**
   * Helper: Check if delivery rider can be assigned
   */
  canAssignRider(): boolean {
    return ['confirmed', 'preparing'].includes(this.status);
  }

  /**
   * Helper: Get order summary for dashboard
   */
  toSummary() {
    return {
      id: this.id,
      user_email: this.user?.email,
      status: this.status,
      total: this.total_price,
      items_count: this.getTotalItems(),
      created_at: this.created_at,
    };
  }
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'wallet'
  | 'bank_transfer';
