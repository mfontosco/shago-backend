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

@Entity('campaigns')
@Index(['tenant_id'])
@Index(['status'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('enum', {
    enum: ['active', 'inactive', 'scheduled', 'ended'],
    default: 'inactive',
  })
  status: string;

  @Column('varchar', { length: 50, nullable: true })
  campaign_type: string; // 'seasonal', 'flash_sale', 'loyalty', 'referral'

  @Column('timestamp')
  start_date: Date;

  @Column('timestamp')
  end_date: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discount_percentage: number;

  @Column('text', { nullable: true })
  banner_url: string;

  @Column('int', { default: 0 })
  total_reach: number;

  @Column('int', { default: 0 })
  total_conversions: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
