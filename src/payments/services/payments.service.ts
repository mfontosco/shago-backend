import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "../entities/payment.entity";
import { AuditLoggerService } from "../../audit-logs/services/audit-logger.service";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private auditLogger: AuditLoggerService,
  ) {}

  async listPayments(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.paymentRepository.findAndCount({
      where: { tenant_id: tenantId },
      skip,
      take: limit,
      order: { created_at: "DESC" },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  
  async getPayment(id: string, tenantId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }

  async createPayment(dto: any, tenantId: string, userId: string) {
    const payment = this.paymentRepository.create({
      ...dto,
      tenant_id: tenantId,
    });
    const saved = await this.paymentRepository.save(payment);
    const savedPayment = Array.isArray(saved) ? saved[0] : saved;
    await this.auditLogger.log({
      userId,
      resource: "payments",
      action: "create",
      entityId: savedPayment.id,
      description: `Payment: ${dto.amount} ${dto.currency}`,
    });
    return saved;
  }

  async updatePaymentStatus(id: string, tenantId: string, status: string, userId: string) {
    const payment = await this.getPayment(id, tenantId);
    payment.payment_status = status;
    const updated = await this.paymentRepository.save(payment);
    await this.auditLogger.log({
      userId,
      resource: "payments",
      action: "update",
      entityId: id,
      description: `Payment status: ${status}`,
    });
    return updated;
  }

  async refundPayment(id: string, tenantId: string, amount: number, userId: string) {
    const payment = await this.getPayment(id, tenantId);
    payment.payment_status = "refunded";
    if (amount) payment.amount = amount;
    const updated = await this.paymentRepository.save(payment);
    await this.auditLogger.log({
      userId,
      resource: "payments",
      action: "refund",
      entityId: id,
      description: "Payment refunded",
    });
    return updated;
  }

  async getPaymentStats(tenantId: string) {
    const total = await this.paymentRepository.count({ where: { tenant_id: tenantId } });
    const completed = await this.paymentRepository.count({
      where: { tenant_id: tenantId, payment_status: "completed" },
    });
    const failed = await this.paymentRepository.count({
      where: { tenant_id: tenantId, payment_status: "failed" },
    });
    const pending = await this.paymentRepository.count({
      where: { tenant_id: tenantId, payment_status: "pending" },
    });

    const result = await this.paymentRepository
      .createQueryBuilder("p")
      .select("SUM(p.amount)", "total")
      .where("p.tenant_id = :tenantId", { tenantId })
      .andWhere("p.payment_status = :status", { status: "completed" })
      .getRawOne();

    return {
      total_transactions: total,
      successful_payments: completed,
      failed_payments: failed,
      pending_payments: pending,
      total_revenue: result?.total ? Number(result.total) : 0,
      completion_rate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
    };
  }
}
