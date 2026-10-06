import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiSecurity } from "@nestjs/swagger";
import { MarketingService } from "../services/marketing.service";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Marketing - Promotions & Campaigns")
@ApiSecurity("bearer")
@Controller("vendor/marketing")
@UseGuards(TenantGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post("promotions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create promotion", description: "Create a new promotion or discount campaign" })
  @ApiBody({
    description: "Promotion data",
    schema: {
      example: {
        title: "Summer Food Festival",
        description: "Get 20% off on all food items this summer",
        discount_value: 20,
        start_date: "2026-09-01T00:00:00Z",
        end_date: "2026-09-30T23:59:59Z",
        promo_type: "discount",
        status: "active",
        recipients_count: 1500
      },
      properties: {
        title: { type: "string", description: "Promotion title/name" },
        description: { type: "string", description: "Detailed promotion description" },
        discount_value: { type: "number", description: "Discount amount or percentage" },
        start_date: { type: "string", format: "date-time", description: "Promotion start date/time" },
        end_date: { type: "string", format: "date-time", description: "Promotion end date/time" },
        promo_type: { type: "string", enum: ["discount", "free_shipping", "buy_one_get_one", "seasonal", "flash_sale"], description: "Type of promotion" },
        status: { type: "string", enum: ["draft", "scheduled", "active", "completed", "cancelled"], description: "Promotion status" },
        recipients_count: { type: "number", description: "Number of recipients for this promotion" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Promotion created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async createPromotion(@Body() dto: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const promotion = await this.marketingService.createPromotion(dto, tenantId, req.user?.id);
    return { statusCode: 201, data: promotion };
  }

  @Get("promotions")
  @ApiOperation({ summary: "List promotions", description: "Get paginated list of all promotions" })
  @ApiQuery({ name: "page", required: false, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, description: "Items per page (default: 20)" })
  @ApiResponse({ status: 200, description: "List of promotions retrieved successfully" })
  async listPromotions(@Query("page") page = 1, @Query("limit") limit = 20, @CurrentTenant() tenantId: string) {
    const result = await this.marketingService.listPromotions(tenantId, Number(page), Number(limit));
    return { statusCode: 200, data: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  @Get("promotions/:id")
  @ApiOperation({ summary: "Get promotion", description: "Retrieve a specific promotion by ID" })
  @ApiParam({ name: "id", description: "Promotion UUID" })
  @ApiResponse({ status: 200, description: "Promotion retrieved successfully" })
  @ApiResponse({ status: 404, description: "Promotion not found" })
  async getPromotion(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    const promotion = await this.marketingService.getPromotion(id, tenantId);
    return { statusCode: 200, data: promotion };
  }

  @Patch("promotions/:id")
  @ApiOperation({ summary: "Update promotion", description: "Update promotion details and status" })
  @ApiParam({ name: "id", description: "Promotion UUID" })
  @ApiBody({
    description: "Promotion update data",
    schema: {
      example: { status: "active", discount_value: 25, end_date: "2026-10-15T23:59:59Z" },
      properties: {
        title: { type: "string", description: "Updated promotion title" },
        description: { type: "string", description: "Updated description" },
        discount_value: { type: "number", description: "Updated discount value" },
        status: { type: "string", enum: ["draft", "scheduled", "active", "completed", "cancelled"], description: "New status" },
        end_date: { type: "string", format: "date-time", description: "Updated end date" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Promotion updated successfully" })
  @ApiResponse({ status: 404, description: "Promotion not found" })
  async updatePromotion(@Param("id", ParseUUIDPipe) id: string, @Body() dto: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const promotion = await this.marketingService.updatePromotion(id, tenantId, dto, req.user?.id);
    return { statusCode: 200, data: promotion };
  }

  @Delete("promotions/:id")
  @ApiOperation({ summary: "Delete promotion", description: "Delete a promotion campaign" })
  @ApiParam({ name: "id", description: "Promotion UUID" })
  @ApiResponse({ status: 200, description: "Promotion deleted successfully" })
  @ApiResponse({ status: 404, description: "Promotion not found" })
  async deletePromotion(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    await this.marketingService.deletePromotion(id, tenantId, req.user?.id);
    return { statusCode: 200, message: "Promotion deleted" };
  }

  @Post("messages")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send bulk message", description: "Send marketing message to multiple recipients" })
  @ApiBody({
    description: "Message data",
    schema: {
      example: {
        recipients: ["john@example.com", "jane@example.com", "bob@example.com"],
        title: "Exclusive Weekend Offer",
        message: "Get 30% off on all pizzas this weekend! Use code SUMMER30 at checkout. Limited time offer!"
      },
      properties: {
        recipients: { type: "array", items: { type: "string", format: "email" }, description: "Array of recipient email addresses" },
        title: { type: "string", description: "Email subject line/title" },
        message: { type: "string", description: "Email body message content" }
      },
      required: ["recipients", "title", "message"]
    }
  })
  @ApiResponse({ status: 201, description: "Message sent successfully" })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async sendMessage(@Body() { recipients, title, message }: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const result = await this.marketingService.sendMessage(recipients, title, message, req.user?.id);
    return result;
  }
}
