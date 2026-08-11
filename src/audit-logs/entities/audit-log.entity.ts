import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entities';

/**
 * Audit Log Entity - Tracks all administrative actions
 *
 * Used for:
 * - Compliance & regulatory requirements
 * - Security incident investigation
 * - User activity tracking
 * - Change history
 *
 * @example
 * User with ADMIN role updates a product
 * → AdminAuditLog created with:
 *    - resource: 'products'
 *    - action: 'update'
 *    - entity_id: product UUID
 *    - changes: { field: 'price', old: 99.99, new: 129.99 }
 */
@Entity('audit_logs')
@Index(['admin_user_id'])
@Index(['resource'])
@Index(['action'])
@Index(['created_at'])
@Index(['resource', 'action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Which user performed the action
   * FK to users table
   */
  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_user_id' })
  admin_user: User;

  @Column({ name: 'admin_user_id', nullable: true })
  admin_user_id: string;

  /**
   * What resource was modified
   * Examples: 'users', 'products', 'orders', 'categories', 'roles'
   */
  @Column()
  resource: string;

  /**
   * What action was performed
   * Examples: 'create', 'read', 'update', 'delete'
   */
  @Column()
  action: string;

  /**
   * ID of the affected entity
   * Examples: user UUID, product UUID, order ID
   */
  @Column()
  entity_id: string;

  /**
   * What changed (for update operations)
   * Format: [{ field: string, old_value: any, new_value: any }]
   */
  @Column('jsonb', { nullable: true })
  changes: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;

  /**
   * Human-readable description
   * Examples: 'User email changed', 'Product price updated'
   */
  @Column({ nullable: true })
  description: string;

  /**
   * Client IP address for security tracking
   */
  @Column({ nullable: true })
  ip_address: string;

  /**
   * User agent string (browser/app info)
   */
  @Column({ nullable: true })
  user_agent: string;

  /**
   * HTTP request method (GET, POST, PATCH, DELETE)
   */
  @Column({ nullable: true })
  http_method: string;

  /**
   * HTTP endpoint that was called
   */
  @Column({ nullable: true })
  endpoint: string;

  /**
   * HTTP status code returned
   */
  @Column({ nullable: true, type: 'integer' })
  status_code: number;

  /**
   * When the action was performed
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * Calculate total fields changed
   */
  getChangedFields(): string[] {
    return this.changes?.map(c => c.field) || [];
  }

  /**
   * Check if specific field was changed
   */
  wasFieldChanged(fieldName: string): boolean {
    return this.changes?.some(c => c.field === fieldName) || false;
  }
}
