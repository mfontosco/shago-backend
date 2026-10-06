import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Campaign } from './campaign.entity';

@Entity('coupons')
@Index(['tenant_id'])
@Index(['code'])
@Index(['status'])
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('uuid', { nullable: true })
  campaign_id: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column('varchar', { length: 50, unique: true })
  code: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('enum', {
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage',
  })
  discount_type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discount_value: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  max_discount: number; // Maximum discount for percentage type

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  min_order_value: number; // Minimum order to use coupon

  @Column('int', { nullable: true })
  max_usage_per_user: number; // How many times a user can use

  @Column('int', { nullable: true })
  total_usage_limit: number; // Total uses across all users

  @Column('int', { default: 0 })
  times_used: number;

  @Column('enum', {
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  })
  status: string;

  @Column('timestamp')
  valid_from: Date;

  @Column('timestamp')
  valid_till: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
