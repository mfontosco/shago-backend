import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { SupportReply } from "./support-reply.entity";

@Entity("support_tickets")
@Index(["tenant_id"])
export class SupportTicket {
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
  subject: string;

  @Column("varchar")
  issue_category: string;

  @Column("text")
  message: string;

  @Column("enum", { enum: ["low", "medium", "high", "urgent"], default: "medium" })
  priority: string;

  @Column("enum", { enum: ["pending", "in_progress", "resolved", "closed"], default: "pending" })
  status: string;

  @Column("varchar", { nullable: true })
  assigned_to: string;

  @OneToMany(() => SupportReply, (reply: SupportReply) => reply.ticket, { cascade: true, eager: false })
  replies: SupportReply[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
