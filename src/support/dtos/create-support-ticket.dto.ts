import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;
}

export class AddReplyDto {
  @IsString()
  message: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status: string;
}
