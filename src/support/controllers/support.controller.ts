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
import { SupportService } from "../services/support.service";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Support - Tickets & Feedback")
@ApiSecurity("bearer")
@Controller("vendor/support")
@UseGuards(TenantGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ===== SUPPORT TICKETS =====
  @Post("tickets")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create support ticket", description: "Create a new customer support ticket" })
  @ApiBody({
    description: "Support ticket data",
    schema: {
      example: {
        subject: "App not loading",
        message: "The mobile app crashes when I try to place an order. Getting error code 500.",
        priority: "high",
        issue_category: "technical",
        customer_name: "John Doe",
        customer_email: "john@example.com"
      },
      properties: {
        subject: { type: "string", description: "Ticket subject/title" },
        message: { type: "string", description: "Detailed issue description" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Priority level" },
        issue_category: { type: "string", description: "Category (technical, billing, order, delivery, other)" },
        customer_name: { type: "string", description: "Customer name" },
        customer_email: { type: "string", description: "Customer email" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Support ticket created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async createTicket(@Body() dto: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const ticket = await this.supportService.createTicket(dto, tenantId, req.user?.id);
    return { statusCode: 201, data: ticket };
  }

  @Get("tickets")
  @ApiOperation({ summary: "List support tickets", description: "Get paginated list of support tickets" })
  @ApiQuery({ name: "page", required: false, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, description: "Items per page (default: 20)" })
  @ApiResponse({ status: 200, description: "List of support tickets retrieved successfully" })
  async listTickets(@Query("page") page = 1, @Query("limit") limit = 20, @CurrentTenant() tenantId: string) {
    const result = await this.supportService.listTickets(tenantId, Number(page), Number(limit));
    return { statusCode: 200, data: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  @Get("tickets/:id")
  @ApiOperation({ summary: "Get support ticket", description: "Retrieve a specific support ticket by ID" })
  @ApiParam({ name: "id", description: "Support ticket UUID" })
  @ApiResponse({ status: 200, description: "Support ticket retrieved successfully" })
  @ApiResponse({ status: 404, description: "Support ticket not found" })
  async getTicket(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    const ticket = await this.supportService.getTicket(id, tenantId);
    return { statusCode: 200, data: ticket };
  }

  @Patch("tickets/:id")
  @ApiOperation({ summary: "Update support ticket status", description: "Update the status of a support ticket (pending, in_progress, resolved, closed)" })
  @ApiParam({ name: "id", description: "Support ticket UUID" })
  @ApiBody({
    description: "Status update data",
    schema: {
      example: { status: "resolved" },
      properties: {
        status: { type: "string", enum: ["pending", "in_progress", "resolved", "closed"], description: "New ticket status" }
      }
    }
  })
  @ApiResponse({ status: 200, description: "Support ticket status updated successfully" })
  @ApiResponse({ status: 404, description: "Support ticket not found" })
  async updateTicket(@Param("id", ParseUUIDPipe) id: string, @Body() { status }: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const ticket = await this.supportService.updateTicketStatus(id, tenantId, status, req.user?.id);
    return { statusCode: 200, data: ticket };
  }

  @Delete("tickets/:id")
  @ApiOperation({ summary: "Delete support ticket", description: "Delete a support ticket" })
  @ApiParam({ name: "id", description: "Support ticket UUID" })
  @ApiResponse({ status: 200, description: "Support ticket deleted successfully" })
  @ApiResponse({ status: 404, description: "Support ticket not found" })
  async deleteTicket(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    await this.supportService.deleteTicket(id, tenantId, req.user?.id);
    return { statusCode: 200, message: "Ticket deleted" };
  }

  // ===== FEEDBACK =====
  @Post("feedback")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create feedback", description: "Create customer feedback or review" })
  @ApiBody({
    description: "Feedback data",
    schema: {
      example: {
        issue_category: "service",
        feedback_text: "Great service! The food was fresh and delivery was on time.",
        rating: 5,
        customer_name: "Jane Smith",
        customer_email: "jane@example.com"
      },
      properties: {
        issue_category: { type: "string", description: "Feedback category (service, quality, delivery, pricing, other)" },
        feedback_text: { type: "string", description: "Detailed feedback content" },
        rating: { type: "number", minimum: 1, maximum: 5, description: "Star rating (1-5)" },
        customer_name: { type: "string", description: "Customer name" },
        customer_email: { type: "string", description: "Customer email" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Feedback created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request data" })
  async createFeedback(@Body() dto: any, @CurrentTenant() tenantId: string) {
    const feedback = await this.supportService.createFeedback(dto, tenantId);
    return { statusCode: 201, data: feedback };
  }

  @Get("feedback")
  @ApiOperation({ summary: "List feedback", description: "Get paginated list of customer feedback" })
  @ApiQuery({ name: "page", required: false, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, description: "Items per page (default: 20)" })
  @ApiResponse({ status: 200, description: "List of feedback retrieved successfully" })
  async listFeedback(@Query("page") page = 1, @Query("limit") limit = 20, @CurrentTenant() tenantId: string) {
    const result = await this.supportService.listFeedback(tenantId, Number(page), Number(limit));
    return { statusCode: 200, data: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  }

  @Get("feedback/:id")
  @ApiOperation({ summary: "Get feedback", description: "Retrieve specific feedback by ID" })
  @ApiParam({ name: "id", description: "Feedback UUID" })
  @ApiResponse({ status: 200, description: "Feedback retrieved successfully" })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  async getFeedback(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    const feedback = await this.supportService.getFeedback(id, tenantId);
    return { statusCode: 200, data: feedback };
  }

  @Patch("feedback/:id")
  @ApiOperation({ summary: "Update feedback status", description: "Update feedback status (pending, acknowledged, resolved)" })
  @ApiParam({ name: "id", description: "Feedback UUID" })
  @ApiBody({ description: "Status update data", schema: { example: { status: "acknowledged" } } })
  @ApiResponse({ status: 200, description: "Feedback status updated successfully" })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  async updateFeedback(@Param("id", ParseUUIDPipe) id: string, @Body() { status }: any, @CurrentTenant() tenantId: string, @Request() req: any) {
    const feedback = await this.supportService.updateFeedbackStatus(id, tenantId, status, req.user?.id);
    return { statusCode: 200, data: feedback };
  }

  @Delete("feedback/:id")
  @ApiOperation({ summary: "Delete feedback", description: "Delete customer feedback" })
  @ApiParam({ name: "id", description: "Feedback UUID" })
  @ApiResponse({ status: 200, description: "Feedback deleted successfully" })
  @ApiResponse({ status: 404, description: "Feedback not found" })
  async deleteFeedback(@Param("id", ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string, @Request() req: any) {
    await this.supportService.deleteFeedback(id, tenantId, req.user?.id);
    return { statusCode: 200, message: "Feedback deleted" };
  }
}
