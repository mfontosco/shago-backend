import { Product } from "../../products/entities/product.entity";
import { VariantAttribute } from "../../variantattribute/entities/variant-attribute.entities";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";



@Entity("product_variant")
export class ProductVariant{
    @PrimaryGeneratedColumn("uuid")
    id:string

    @Column({nullable: true})
    sku: string

    @Column("decimal",{
        precision:10,
        scale: 2
    })
    price: number

     @Column("decimal",{
        precision:10,
        scale: 2
    })
    old_price: number

     @Column("decimal",{
        precision:10,
        scale: 2
    })
    new_price: number

    @Column({type:"int", default:0})
    stock:number


    @Column({nullable: true})
    barcode: string


    @Column({default:true})
    is_active: boolean

    @ManyToOne(()=>Product, (prod)=>prod.variants,{onDelete:"CASCADE"})
    product: Product

    @OneToMany(()=>VariantAttribute,(varAttr)=>varAttr.product_variant)
    attributes:VariantAttribute[]

}