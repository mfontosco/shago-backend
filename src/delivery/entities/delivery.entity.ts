import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Rider } from './rider.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Delivery Entity
 *
 * Tracks delivery details for orders
 * Links orders to riders and manages delivery progress
 * Multi-tenancy: tenant_id ensures vendor data isolation
 */
@Entity('deliveries')
@Index(['tenant_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'created_at'])
@Index(['order_id'])
@Index(['rider_id'])
@Index(['status', 'created_at'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← Which vendor owns this delivery?

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('uuid')
  order_id: string;

  @Column('uuid', { nullable: true })
  rider_id: string;

  @Column('enum', {
    enum: [
      'pending',
      'assigned',
      'pickup_ready',
      'picked_up',
      'in_transit',
      'delivered',
      'failed',
      'cancelled',
    ],
    default: 'pending',
  })
  status:
    | 'pending'
    | 'assigned'
    | 'pickup_ready'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'cancelled';

  @Column('varchar', { length: 255, nullable: true })
  pickup_address: string;

  @Column('varchar', { length: 255, nullable: true })
  delivery_address: string;

  @Column('varchar', { length: 100, nullable: true })
  recipient_name: string;

  @Column('varchar', { length: 20, nullable: true })
  recipient_phone: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  estimated_delivery_time: number; // in hours

  @Column('timestamp', { nullable: true })
  pickup_time: Date;

  @Column('timestamp', { nullable: true })
  delivery_time: Date;

  @Column('text', { nullable: true })
  delivery_proof_url: string; // photo of delivered package

  @Column('varchar', { length: 500, nullable: true })
  rejection_reason: string;

  @Column('integer', { default: 0 })
  delivery_attempts: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  delivery_fee: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  current_latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  current_longitude: number;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('varchar', { length: 255, nullable: true })
  deleted_at: string;

  // Relationships
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Rider, (rider) => rider.deliveries)
  @JoinColumn({ name: 'rider_id' })
  rider: Rider;

  // Helper methods
  toSummary() {
    return {
      id: this.id,
      order_id: this.order_id,
      rider_id: this.rider_id,
      status: this.status,
      delivery_address: this.delivery_address,
      recipient_name: this.recipient_name,
      estimated_delivery_time: this.estimated_delivery_time,
      delivery_fee: this.delivery_fee,
    };
  }

  canBeAssigned(): boolean {
    return this.status === 'pending' || this.status === 'failed';
  }

  canBePickedUp(): boolean {
    return this.status === 'assigned' || this.status === 'pickup_ready';
  }

  canBeDelivered(): boolean {
    return (
      this.status === 'picked_up' ||
      this.status === 'in_transit' ||
      this.status === 'failed'
    );
  }

  canBeCancelled(): boolean {
    return (
      this.status !== 'delivered' &&
      this.status !== 'cancelled' &&
      this.status !== 'picked_up'
    );
  }
}
