import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiSecurity } from "@nestjs/swagger";
import { PaymentsService } from "../services/payments.service";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Payments - Transactions & Refunds")
@ApiSecurity("bearer")
@Controller("vendor/payments")
@UseGuards(TenantGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: "List payments", description: "Get paginated list of all payment transactions" })
  @ApiQuery({ name: "page", required: false, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, description: "Items per page (default: 20)" })
  @ApiResponse({ status: 200, description: "List of payments retrieved successfully" })
  async listPayments(@Query("page") page = 1, @Query("limit") limit = 20, @CurrentTenant() tenantId: string) {
    const result = await this.paymentsService.listPayments(tenantId, Number(page), Number(limit));
    return { statusCode: 200, data: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment", description: "Retrieve a specific payment transaction by ID" })
  @ApiParam({ name: "id", description: "Payment UUID" })
  @ApiResponse({ status: 200, description: "Payment retrieved successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async getPayment(@Param("id") id: string, @CurrentTenant() tenantId: string) {
    const payment = await this.paymentsService.getPayment(id, tenantId);
    return { statusCode: 200, data: payment };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create payment record", description: "Create a new payment transaction record" })
  @ApiBody({
    description: "Payment data",
    schema: {
      example: {
        order_id: "550e8400-e29b-41d4-a716-446655440000",
        amount: 89.99,
        currency: "USD",
        payment_method: "card",
        transaction_reference: "TXN-20260823-12345",
        payment_status: "pending"
      },
      properties: {
        order_id: { type: "string", format: "uuid", description: "Associated order UUID" },
        amount: { type: "number", description: "Payment amount" },
        currency: { type: "string", description: "Currency code (USD, EUR, GBP, etc.)" },
        payment_method: { type: "string", enum: ["card", "bank_transfer", "wallet", "cash", "other"], description: "Payment method" },
        transaction_reference: { type: "string", description: "Payment gateway transaction ID" },
        payment_status: { type: "string", enum: ["pending", "completed", "failed", "refunded", "cancelled"], description: "Payment status" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Payment created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async createPayment(@Body() dto: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const payment = await this.paymentsService.createPayment(dto, tenantId, req.user?.id);
    return { statusCode: 201, data: payment };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update payment status", description: "Update payment status (pending, completed, failed, refunded, cancelled)" })
  @ApiParam({ name: "id", description: "Payment UUID" })
  @ApiBody({
    description: "Status update data",
    schema: {
      example: { payment_status: "completed" },
      properties: {
        payment_status: { type: "string", enum: ["pending", "completed", "failed", "refunded", "cancelled"], description: "New payment status" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Payment status updated successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async updatePaymentStatus(@Param("id") id: string, @Body() { payment_status }: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const payment = await this.paymentsService.updatePaymentStatus(id, tenantId, payment_status, req.user?.id);
    return { statusCode: 200, data: payment };
  }

  @Post(":id/refund")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Refund payment", description: "Process a refund for a payment transaction" })
  @ApiParam({ name: "id", description: "Payment UUID" })
  @ApiBody({
    description: "Refund data",
    schema: {
      example: { amount: 89.99 },
      properties: {
        amount: { type: "number", description: "Refund amount (optional, full refund if omitted)" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Refund processed successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async refundPayment(@Param("id") id: string, @Body() { amount }: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const payment = await this.paymentsService.refundPayment(id, tenantId, amount, req.user?.id);
    return { statusCode: 201, data: payment };
  }

  @Get("summary")
  @ApiOperation({ summary: "Get payment statistics", description: "Retrieve payment summary and statistics" })
  @ApiResponse({ status: 200, description: "Payment statistics retrieved successfully" })
  async getPaymentSummary(@CurrentTenant() tenantId: string) {
    const stats = await this.paymentsService.getPaymentStats(tenantId);
    return { statusCode: 200, data: stats };
  }

  @Get("order/:orderId")
  @ApiOperation({ summary: "Get payment by order", description: "Retrieve payment information for a specific order" })
  @ApiParam({ name: "orderId", description: "Order UUID" })
  @ApiResponse({ status: 200, description: "Order payment retrieved successfully" })
  @ApiResponse({ status: 404, description: "Payment not found" })
  async getByOrderId(@Param("orderId") orderId: string, @CurrentTenant() tenantId: string) {
    const payment = await this.paymentsService.getPayment(orderId, tenantId);
    return { statusCode: 200, data: payment };
  }
}
