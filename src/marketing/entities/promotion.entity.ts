import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { Tenant } from "../../tenants/entities/tenant.entity";

@Entity("promotions")
@Index(["tenant_id"])
export class Promotion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column("varchar")
  title: string;

  @Column("text", { nullable: true })
  description: string;

  @Column("enum", {
    enum: ["discount", "free_shipping", "buy_one_get_one", "seasonal", "flash_sale"],
  })
  promo_type: string;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  discount_value: number;

  @Column("int", { default: 0 })
  recipients_count: number;

  @Column("enum", {
    enum: ["draft", "scheduled", "active", "completed", "cancelled"],
    default: "draft",
  })
  status: string;

  @Column("timestamp")
  start_date: Date;

  @Column("timestamp", { nullable: true })
  end_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
