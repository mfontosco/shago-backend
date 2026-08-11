import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

/**
 * Tenant Entity
 *
 * Represents a customer/organization in the multi-tenant system
 * All other entities reference this to enforce data isolation
 *
 * Examples:
 * - "Acme Corp" (tenant_id: uuid-123)
 * - "Tech Startup" (tenant_id: uuid-456)
 * - Each has separate orders, products, riders, etc.
 */
@Entity('tenants')
@Index(['slug'])
@Index(['status', 'created_at'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255, unique: true })
  name: string; // "Acme Corp", "Tech Startup"

  @Column('varchar', { length: 255, unique: true, nullable: true })
  slug: string; // "acme-corp", "tech-startup" (for URL: app.shago.com/acme-corp)

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 255, nullable: true })
  logo_url: string;

  @Column('varchar', { length: 255, nullable: true })
  website: string;

  @Column('varchar', { length: 20, nullable: true })
  country: string;

  @Column('varchar', { length: 20, nullable: true })
  currency: string; // 'AED', 'USD', etc.

  @Column('enum', {
    enum: ['trial', 'active', 'suspended', 'inactive'],
    default: 'trial',
  })
  status: 'trial' | 'active' | 'suspended' | 'inactive';

  @Column('varchar', { length: 50, nullable: true })
  plan: string; // 'starter', 'pro', 'enterprise'

  @Column('timestamp', { nullable: true })
  subscription_expires_at: Date;

  @Column('integer', { default: 100 })
  max_users: number;

  @Column('integer', { default: 1000 })
  max_products: number;

  @Column('integer', { default: 10000 })
  max_orders: number;

  @Column('boolean', { default: true })
  is_active: boolean;

  @Column('text', { nullable: true })
  settings: string; // JSON stored as string (payment methods, delivery zones, etc.)

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('varchar', { length: 255, nullable: true })
  deleted_at: string;

  // Statistics
  @Column('integer', { default: 0 })
  total_users: number;

  @Column('integer', { default: 0 })
  total_products: number;

  @Column('integer', { default: 0 })
  total_orders: number;

  @Column('integer', { default: 0 })
  total_deliveries: number;

  /**
   * Get public tenant info (safe to send to frontend)
   */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      logo_url: this.logo_url,
      website: this.website,
      currency: this.currency,
    };
  }

  /**
   * Get admin tenant info (full details)
   */
  toAdmin() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      logo_url: this.logo_url,
      website: this.website,
      country: this.country,
      currency: this.currency,
      status: this.status,
      plan: this.plan,
      subscription_expires_at: this.subscription_expires_at,
      max_users: this.max_users,
      max_products: this.max_products,
      max_orders: this.max_orders,
      total_users: this.total_users,
      total_products: this.total_products,
      total_orders: this.total_orders,
      total_deliveries: this.total_deliveries,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  isTrialExpired(): boolean {
    if (!this.subscription_expires_at) return false;
    return new Date() > this.subscription_expires_at;
  }

  canCreateUsers(): boolean {
    return this.status === 'active' && this.total_users < this.max_users;
  }

  canCreateProducts(): boolean {
    return (
      this.status === 'active' && this.total_products < this.max_products
    );
  }

  canCreateOrders(): boolean {
    return this.status === 'active' && this.total_orders < this.max_orders;
  }
}
