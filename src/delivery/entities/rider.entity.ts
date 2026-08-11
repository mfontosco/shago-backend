import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Delivery } from './delivery.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * Rider Entity
 *
 * Represents delivery riders/drivers
 * Tracks availability, performance metrics, and assignment history
 * Multi-tenancy: tenant_id ensures vendor owns their riders
 */
@Entity('riders')
@Index(['tenant_id'])
@Index(['tenant_id', 'status'])
@Index(['status', 'created_at'])
@Index(['phone'])
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← Which vendor owns this rider?

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 20, unique: true })
  phone: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('enum', {
    enum: ['available', 'unavailable', 'on_delivery', 'on_break', 'inactive'],
    default: 'available',
  })
  status: 'available' | 'unavailable' | 'on_delivery' | 'on_break' | 'inactive';

  @Column('varchar', { length: 20, nullable: true })
  vehicle_type: string; // bike, car, scooter, etc.

  @Column('varchar', { length: 100, nullable: true })
  vehicle_plate: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  rating: number; // 0-5 stars

  @Column('integer', { default: 0 })
  total_deliveries: number;

  @Column('integer', { default: 0 })
  completed_deliveries: number;

  @Column('integer', { default: 0 })
  cancelled_deliveries: number;

  @Column('decimal', { precision: 5, scale: 2, default: 100 })
  completion_rate: number; // percentage

  @Column('boolean', { default: true })
  is_active: boolean;

  @Column('varchar', { length: 255, nullable: true })
  current_location: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('varchar', { length: 255, nullable: true })
  deleted_at: string;

  // Relationships
  @OneToMany(() => Delivery, (delivery) => delivery.rider)
  deliveries: Delivery[];

  // Helper methods
  toSummary() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      status: this.status,
      rating: this.rating,
      total_deliveries: this.total_deliveries,
      completion_rate: this.completion_rate,
    };
  }

  getPerformanceMetrics() {
    return {
      total_deliveries: this.total_deliveries,
      completed_deliveries: this.completed_deliveries,
      cancelled_deliveries: this.cancelled_deliveries,
      completion_rate: this.completion_rate,
      rating: this.rating,
      status: this.status,
    };
  }
}
