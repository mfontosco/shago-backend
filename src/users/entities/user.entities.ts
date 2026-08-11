import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Role } from "../../roles/entities/role.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("users")
@Index(['email'])
@Index(['tenant_id'])
@Index(['tenant_id', 'active'])
export class User{
@PrimaryGeneratedColumn("uuid")
id: string

@Column('uuid', { nullable: true })
tenant_id: string;  // ← Which tenant does this user belong to?

@ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
@JoinColumn({ name: 'tenant_id' })
tenant: Tenant;

@Column({nullable: true})
fullName: string

@Column({unique: true})
email: string

@Column({select:false})
password: string

@Column()
active: boolean;

@Column({ nullable: true })
role_id: string;

@ManyToOne(() => Role, { eager: true, nullable: true })
@JoinColumn({ name: 'role_id' })
role: Role;

@CreateDateColumn({type: "timestamp"})
created_at: Date

@UpdateDateColumn({type: "timestamp"})
updated_at: Date

// Helper: Check if this user belongs to a specific tenant
belongsToTenant(tenantId: string): boolean {
  return this.tenant_id === tenantId;
}

}