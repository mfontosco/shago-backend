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

@Entity('payouts')
@Index(['tenant_id'])
@Index(['status'])
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('varchar', { length: 3 })
  currency: string;

  @Column('enum', {
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Column('varchar', { length: 100 })
  payout_method: string; // 'bank_transfer', 'mobile_money'

  @Column('varchar', { length: 50 })
  account_number: string;

  @Column('varchar', { length: 255 })
  account_name: string;

  @Column('varchar', { length: 255, nullable: true })
  payout_reference: string; // Gateway reference

  @Column('text', { nullable: true })
  failure_reason: string;

  @Column('int', { default: 0 })
  retry_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('timestamp', { nullable: true })
  completed_at: Date;
}
