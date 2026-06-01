import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";


@Entity("users")
export class User{
@PrimaryGeneratedColumn("uuid")
id: string

@Column({nullable: true})
fullName: string

@Column({unique: true})
email: string

@Column({select:false})
password: string

@Column()
active:  boolean;

@CreateDateColumn({type: "timestamp"})
created_at: Date

@UpdateDateColumn({type: "timestamp"})
updated_at: Date
}