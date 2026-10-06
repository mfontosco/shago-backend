import { Product } from "../../products/entities/product.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



@Entity("productImage")
export class ProductImage{
    @PrimaryGeneratedColumn("uuid")
    id:string

    @Column({})
    url: string

    @ManyToOne(()=>Product,{
        onDelete:"CASCADE"
    })
    product:Product

    @CreateDateColumn()
    created_at:Date

    @UpdateDateColumn()
    updated_at:Date
}