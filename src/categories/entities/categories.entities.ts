import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity("catgeories")
export class Categeories{
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({nullable:true})
    name:string

    @Column({nullable:true})
    slug:string

    @Column({nullable:true})
    description: string

    @CreateDateColumn()
    created_at:Date

    @UpdateDateColumn()
    updated_at:Date
}