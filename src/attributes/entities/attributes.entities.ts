import { AttributeValue } from "../../attribute_value/entities/attribute_value.entities";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



@Entity("attributes")
export class Attributes{
    @PrimaryGeneratedColumn("uuid")
    id: string
    
    @Column()
    name: string

    @Column()
    slug: string

    @Column()
    sort_order: string

    // @Column({type:"text"})
    // tags:string[]
    @OneToMany(()=>AttributeValue,(value)=>value.attribute)
    values:AttributeValue[]
      
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}