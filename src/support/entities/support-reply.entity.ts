import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { User } from '../../users/entities/user.entities';

@Entity('support_replies')
export class SupportReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ticket_id: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicket;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('text')
  message: string;

  @CreateDateColumn()
  created_at: Date;
}
