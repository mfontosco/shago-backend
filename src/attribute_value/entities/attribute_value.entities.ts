import { Attributes } from "../../attributes/entities/attributes.entities"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity("attribute_value")
export class AttributeValue{
    @PrimaryGeneratedColumn("uuid")
    id:string;

    @Column()
    value: string

    @ManyToOne(()=>Attributes,(attr)=>attr.values)
    attribute:Attributes
}