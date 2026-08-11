import { ProductVariant } from "../../productvariant/entities/product-variant.entities";
import { ManyToOne, PrimaryGeneratedColumn, Entity } from "typeorm";


@Entity("variant_attributes")
export class VariantAttribute{

    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(()=>ProductVariant, (prod_var)=>prod_var.attributes,)
    product_variant: ProductVariant



    
}