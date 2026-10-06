import { Product } from "../../products/entities/product.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("catgeories")
@Index(['tenant_id'])
@Index(['tenant_id', 'created_at'])
export class Categeories{
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column('uuid', { nullable: true })
    tenant_id: string;  // ← Which vendor owns this category?

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({nullable:true})
    name:string

    @Column({nullable:true})
    slug:string

    @Column({nullable:true})
    description: string

    @Column({nullable:true})
    image_url: string

    @OneToMany(()=>Product,(prod)=>prod.category)
    product:Product

    @CreateDateColumn()
    created_at:Date

    @UpdateDateColumn()
    updated_at:Date
}