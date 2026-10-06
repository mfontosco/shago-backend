import { IsString, IsNumber, IsEmail, IsOptional, IsEnum, IsUUID } from "class-validator";

export class InitiatePaymentDto {
  @IsUUID()
  order_id: string;

  @IsEmail()
  customer_email: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsEnum(["paystack", "flutterwave"])
  payment_method: string;
}
