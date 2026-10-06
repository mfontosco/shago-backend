import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * OrderItem Entity - Represents a single product in an order
 *
 * Tracks:
 * - Which product was ordered
 * - Quantity ordered
 * - Price at time of order
 * - Variants (if applicable)
 *
 * Used by:
 * - Order details view (show all items in order)
 * - Dashboard (item count, revenue calculation)
 * - Inventory management (track sold items)
 */
@Entity('order_items')
@Index(['order_id'])
@Index(['product_id'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Which order this item belongs to
   * FK to orders table
   */
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  order_id: string;

  /**
   * Which product was ordered
   * FK to products table
   */
  @ManyToOne(() => Product, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', nullable: true })
  product_id: string;

  /**
   * Product name snapshot (in case product name changes later)
   * Useful for order history
   */
  @Column()
  product_name: string;

  /**
   * Product SKU snapshot
   */
  @Column({ nullable: true })
  product_sku: string;

  /**
   * Quantity ordered
   */
  @Column({ type: 'integer' })
  quantity: number;

  /**
   * Unit price at time of order
   * (May differ from current product price)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  unit_price: number;

  /**
   * Subtotal for this item (quantity * unit_price)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  /**
   * Discount applied to this item (if any)
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  /**
   * Total for this line (subtotal - discount)
   */
  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  /**
   * Product variant (if applicable)
   * Examples: size, color, etc.
   */
  @Column({ nullable: true })
  variant: string;

  /**
   * Custom notes for this item
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * When this item was added to order
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * Helper: Get item total with discount
   */
  getTotal(): number {
    return this.subtotal - this.discount;
  }

  /**
   * Helper: Format for display
   */
  toSummary() {
    return {
      id: this.id,
      product_name: this.product_name,
      quantity: this.quantity,
      unit_price: this.unit_price,
      total: this.total,
      variant: this.variant,
    };
  }
}
