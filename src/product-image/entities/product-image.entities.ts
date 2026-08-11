import { Product } from "../../product/entities/products.entities";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";



@Entity("productImage")
export class ProductImage{
    @PrimaryGeneratedColumn("uuid")
    id:string

    @Column({})
    url: string

    @ManyToOne(()=>Product, (prod)=>prod.images,{
        onDelete:"CASCADE"
    })
    product:Product

    @CreateDateColumn()
    created_at:Date

    @UpdateDateColumn()
    updated_at:Date
}