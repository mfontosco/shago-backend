import {
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsLatitude,
  IsLongitude,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Item to add to order
 */
export class OrderItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Create Order DTO
 * Used when customer creates an order
 */
export class CreateOrderDto {
  @IsUUID()
  user_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  delivery_address: string;

  @IsLatitude()
  @Type(() => Number)
  delivery_latitude: number;

  @IsLongitude()
  @Type(() => Number)
  delivery_longitude: number;

  @IsEnum(['credit_card', 'debit_card', 'cash', 'wallet', 'bank_transfer'])
  payment_method: string;

  @IsOptional()
  @IsString()
  special_instructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

/**
 * Update Order DTO
 * Used by admin to update order details
 */
export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  delivery_latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  delivery_longitude?: number;

  @IsOptional()
  @IsEnum(['credit_card', 'debit_card', 'cash', 'wallet', 'bank_transfer'])
  payment_method?: string;

  @IsOptional()
  @IsString()
  special_instructions?: string;
}

/**
 * Update Order Status DTO
 * Used to change order status
 */
export class UpdateOrderStatusDto {
  @IsEnum([
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
  ])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string; // For cancellations
}

/**
 * Assign Rider DTO
 * Used to assign a delivery rider to an order
 */
export class AssignRiderDto {
  @IsUUID()
  rider_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_delivery_time?: number; // in minutes
}

/**
 * Query Orders DTO
 * Used for filtering/pagination when listing orders
 */
export class QueryOrdersDto {
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsEnum([
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  from_date?: string; // ISO date string

  @IsOptional()
  @IsString()
  to_date?: string; // ISO date string

  @IsOptional()
  @IsString()
  sort_by?: 'created_at' | 'total_price' | 'status';

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Order Response DTO
 * What is returned to client
 */
export class OrderResponseDto {
  id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  status: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total_price: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  payment_method: string;
  special_instructions?: string;
  rider_id?: string;
  estimated_delivery_time?: number;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
}
