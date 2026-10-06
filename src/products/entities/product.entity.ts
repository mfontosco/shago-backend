import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Categeories } from '../../categories/entities/categories.entities';
import { ProductVariant } from '../../productvariant/entities/product-variant.entities';

/**
 * Product Entity
 *
 * Represents a product for sale by a vendor/restaurant
 * Each product belongs to one tenant (vendor)
 *
 * Multi-tenancy: tenant_id ensures data isolation
 */
@Entity('products')
@Index(['tenant_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'created_at'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;  // ← CRITICAL: Which vendor owns this product?

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('varchar', { length: 100, unique: true })
  sku: string;  // Stock Keeping Unit - unique per tenant

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('integer', { default: 0 })
  stock_quantity: number;

  @Column('varchar', { length: 255, nullable: true })
  image_url: string;

  @Column('uuid', { nullable: true })
  category_id: string;

  @ManyToOne(() => Categeories, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Categeories;

  @OneToMany(() => ProductVariant, (variant) => variant.product, { cascade: true })
  variants: ProductVariant[];

  @Column('enum', {
    enum: ['active', 'archived', 'discontinued'],
    default: 'active',
  })
  status: 'active' | 'archived' | 'discontinued';

  @Column('boolean', { default: false })
  is_featured: boolean;

  @Column('integer', { default: 0 })
  reorder_level: number;  // Alert when stock falls below this

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Helper methods
  isLowStock(): boolean {
    return this.stock_quantity <= this.reorder_level;
  }

  canBeSold(): boolean {
    return this.status === 'active' && this.stock_quantity > 0;
  }
}
