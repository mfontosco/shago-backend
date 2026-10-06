import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
  IsUUID,
  Min,
  MinDate,
  MaxDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(['seasonal', 'promotional', 'flash_sale', 'loyalty', 'referral'])
  campaign_type: 'seasonal' | 'promotional' | 'flash_sale' | 'loyalty' | 'referral';

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usage_limit?: number;

  @IsOptional()
  @IsString()
  target_audience?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'draft', 'paused', 'completed', 'cancelled'])
  status?: 'active' | 'draft' | 'paused' | 'completed' | 'cancelled';

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @IsOptional()
  @IsString()
  target_audience?: string;
}

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['percentage', 'fixed_amount', 'free_shipping'])
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';

  @IsNumber()
  @Min(0)
  discount_value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_value?: number;

  @Type(() => Date)
  @IsDate()
  valid_from: Date;

  @Type(() => Date)
  @IsDate()
  valid_until: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usage_limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_usage_per_customer?: number;

  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @IsOptional()
  @IsString()
  applicable_products?: string;

  @IsOptional()
  @IsString()
  applicable_categories?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['percentage', 'fixed_amount', 'free_shipping'])
  discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping';

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  valid_from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  valid_until?: Date;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'expired'])
  status?: 'active' | 'inactive' | 'expired';
}

export class CreateMarketingTemplateDto {
  @IsString()
  name: string;

  @IsEnum([
    'email_promotion',
    'sms_notification',
    'push_notification',
    'in_app_banner',
    'newsletter',
  ])
  template_type:
    | 'email_promotion'
    | 'sms_notification'
    | 'push_notification'
    | 'in_app_banner'
    | 'newsletter';

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  call_to_action_text?: string;

  @IsOptional()
  @IsString()
  call_to_action_url?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduled_send_date?: Date;

  @IsOptional()
  @IsString()
  tags?: string;
}

export class UpdateMarketingTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  call_to_action_text?: string;

  @IsOptional()
  @IsString()
  call_to_action_url?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'scheduled', 'archived'])
  status?: 'draft' | 'active' | 'scheduled' | 'archived';

  @IsOptional()
  @IsString()
  tags?: string;
}
