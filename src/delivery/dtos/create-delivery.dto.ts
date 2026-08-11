import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsEnum,
  IsDecimal,
} from 'class-validator';

/**
 * Create Delivery DTO
 * Used when creating new delivery records
 */
export class CreateDeliveryDto {
  @IsUUID()
  order_id: string;

  @IsString()
  @IsOptional()
  pickup_address?: string;

  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  recipient_name?: string;

  @IsString()
  @IsOptional()
  recipient_phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(12)
  estimated_delivery_time?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Update Delivery DTO
 */
export class UpdateDeliveryDto {
  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  recipient_name?: string;

  @IsString()
  @IsOptional()
  recipient_phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  @Max(12)
  estimated_delivery_time?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Assign Rider DTO
 */
export class AssignRiderDto {
  @IsUUID()
  rider_id: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery_fee?: number;
}

/**
 * Update Delivery Status DTO
 */
export class UpdateDeliveryStatusDto {
  @IsEnum([
    'pending',
    'assigned',
    'pickup_ready',
    'picked_up',
    'in_transit',
    'delivered',
    'failed',
    'cancelled',
  ])
  status:
    | 'pending'
    | 'assigned'
    | 'pickup_ready'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'cancelled';

  @IsString()
  @IsOptional()
  rejection_reason?: string;

  @IsString()
  @IsOptional()
  delivery_proof_url?: string;
}

/**
 * Update Rider Location DTO
 */
export class UpdateRiderLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  current_location?: string;
}

/**
 * Query Deliveries DTO
 */
export class QueryDeliveriesDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsEnum([
    'pending',
    'assigned',
    'pickup_ready',
    'picked_up',
    'in_transit',
    'delivered',
    'failed',
    'cancelled',
  ])
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  rider_id?: string;

  @IsUUID()
  @IsOptional()
  order_id?: string;

  @IsEnum(['created_at', 'status', 'delivery_time'])
  @IsOptional()
  sort_by?: string = 'created_at';

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Query Riders DTO
 */
export class QueryRidersDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsEnum(['available', 'unavailable', 'on_delivery', 'on_break', 'inactive'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string; // search by name or phone

  @IsEnum(['created_at', 'rating', 'completed_deliveries'])
  @IsOptional()
  sort_by?: string = 'created_at';

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Delivery Response DTO
 */
export class DeliveryResponseDto {
  id: string;
  order_id: string;
  rider_id: string;
  status: string;
  delivery_address: string;
  recipient_name: string;
  recipient_phone: string;
  estimated_delivery_time: number;
  delivery_fee: number;
  pickup_time: Date;
  delivery_time: Date;
  delivery_attempts: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Rider Response DTO
 */
export class RiderResponseDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  vehicle_type: string;
  vehicle_plate: string;
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  completion_rate: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
