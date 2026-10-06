import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicket } from "../entities/support-ticket.entity";
import { Feedback } from "../entities/feedback.entity";
import { AuditLoggerService } from "../../audit-logs/services/audit-logger.service";

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    private auditLogger: AuditLoggerService,
  ) {}

  // ===== SUPPORT TICKETS =====
  async createTicket(dto: any, tenantId: string, userId: string) {
    const ticket = this.ticketRepository.create({
      ...dto,
      tenant_id: tenantId,
    });
    const saved = await this.ticketRepository.save(ticket);
    const savedTicket = Array.isArray(saved) ? saved[0] : saved;
    await this.auditLogger.log({
      userId,
      resource: "support_tickets",
      action: "create",
      entityId: savedTicket.id,
      description: dto.subject,
    });
    return saved;
  }

  async listTickets(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.ticketRepository.findAndCount({
      where: { tenant_id: tenantId },
      skip,
      take: limit,
      order: { created_at: "DESC" },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getTicket(id: string, tenantId: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async updateTicketStatus(id: string, tenantId: string, status: string, userId: string) {
    const ticket = await this.getTicket(id, tenantId);
    ticket.status = status;
    const updated = await this.ticketRepository.save(ticket);
    await this.auditLogger.log({
      userId,
      resource: "support_tickets",
      action: "update",
      entityId: id,
      description: `Status: ${status}`,
    });
    return updated;
  }

  async deleteTicket(id: string, tenantId: string, userId: string) {
    await this.getTicket(id, tenantId);
    await this.ticketRepository.delete({ id, tenant_id: tenantId });
    await this.auditLogger.log({
      userId,
      resource: "support_tickets",
      action: "delete",
      entityId: id,
      description: "Ticket deleted",
    });
  }

  // ===== FEEDBACK =====
  async createFeedback(dto: any, tenantId: string) {
    const feedback = this.feedbackRepository.create({ ...dto, tenant_id: tenantId });
    return await this.feedbackRepository.save(feedback);
  }

  async listFeedback(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.feedbackRepository.findAndCount({
      where: { tenant_id: tenantId },
      skip,
      take: limit,
      order: { created_at: "DESC" },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getFeedback(id: string, tenantId: string) {
    const feedback = await this.feedbackRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!feedback) throw new NotFoundException("Feedback not found");
    return feedback;
  }

  async updateFeedbackStatus(id: string, tenantId: string, status: string, userId: string) {
    const feedback = await this.getFeedback(id, tenantId);
    feedback.status = status;
    const updated = await this.feedbackRepository.save(feedback);
    await this.auditLogger.log({
      userId,
      resource: "feedback",
      action: "update",
      entityId: id,
      description: `Status: ${status}`,
    });
    return updated;
  }

  async deleteFeedback(id: string, tenantId: string, userId: string) {
    await this.getFeedback(id, tenantId);
    await this.feedbackRepository.delete({ id, tenant_id: tenantId });
    await this.auditLogger.log({
      userId,
      resource: "feedback",
      action: "delete",
      entityId: id,
      description: "Feedback deleted",
    });
  }
}
