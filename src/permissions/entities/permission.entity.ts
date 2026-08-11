import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  resource: string; // e.g., 'users', 'products', 'orders'

  @Column({ nullable: true })
  action: string; // e.g., 'create', 'read', 'update', 'delete'

  @CreateDateColumn()
  created_at: Date;
}
