import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("feedback")
@Index(["tenant_id"])
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column("varchar")
  customer_name: string;

  @Column("varchar", { nullable: true })
  customer_email: string;

  @Column("varchar")
  issue_category: string;

  @Column("text")
  feedback_text: string;

  @Column("int", { nullable: true })
  rating: number;

  @Column("enum", { enum: ["pending", "acknowledged", "resolved"], default: "pending" })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
