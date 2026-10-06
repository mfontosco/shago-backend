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
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('marketing_templates')
@Index(['tenant_id', 'template_type'])
@Index(['tenant_id', 'created_at'])
export class MarketingTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: [
      'email_promotion',
      'sms_notification',
      'push_notification',
      'in_app_banner',
      'newsletter',
    ],
  })
  template_type:
    | 'email_promotion'
    | 'sms_notification'
    | 'push_notification'
    | 'in_app_banner'
    | 'newsletter';

  @Column('text')
  subject: string;

  @Column('text')
  body: string;

  @Column('text', { nullable: true })
  image_url: string;

  @Column('text', { nullable: true })
  call_to_action_text: string;

  @Column('text', { nullable: true })
  call_to_action_url: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'active', 'scheduled', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'active' | 'scheduled' | 'archived';

  @Column('timestamp', { nullable: true })
  scheduled_send_date: Date;

  @Column('integer', { default: 0 })
  send_count: number;

  @Column('integer', { default: 0 })
  open_count: number;

  @Column('integer', { default: 0 })
  click_count: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  open_rate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  click_rate: number;

  @Column('text', { nullable: true })
  tags: string;

  @Column('boolean', { default: false })
  is_archived: boolean;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
