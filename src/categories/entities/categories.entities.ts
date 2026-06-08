import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";


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

    @CreateDateColumn()
    updated_at:Date
}