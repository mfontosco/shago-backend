import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Promotion } from "../entities/promotion.entity";
import { AuditLoggerService } from "../../audit-logs/services/audit-logger.service";

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    private auditLogger: AuditLoggerService,
  ) {}

  async createPromotion(dto: any, tenantId: string, userId: string) {
    const promotion = this.promotionRepository.create({ ...dto, tenant_id: tenantId });
    const saved = await this.promotionRepository.save(promotion) as any;
    await this.auditLogger.log({
      userId,
      resource: "promotions",
      action: "create",
      entityId: saved.id || "unknown",
      description: dto.title,
    });
    return saved;
  }

  async listPromotions(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.promotionRepository.findAndCount({
      where: { tenant_id: tenantId },
      skip,
      take: limit,
      order: { created_at: "DESC" },
    });
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getPromotion(id: string, tenantId: string) {
    const promotion = await this.promotionRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!promotion) throw new NotFoundException("Promotion not found");
    return promotion;
  }

  async updatePromotion(id: string, tenantId: string, dto: any, userId: string) {
    const promotion = await this.getPromotion(id, tenantId);
    Object.assign(promotion, dto);
    const updated = await this.promotionRepository.save(promotion);
    await this.auditLogger.log({
      userId,
      resource: "promotions",
      action: "update",
      entityId: id,
      description: "Promotion updated",
    });
    return updated;
  }

  async deletePromotion(id: string, tenantId: string, userId: string) {
    await this.getPromotion(id, tenantId);
    await this.promotionRepository.delete({ id, tenant_id: tenantId });
    await this.auditLogger.log({
      userId,
      resource: "promotions",
      action: "delete",
      entityId: id,
      description: "Promotion deleted",
    });
  }

  async sendMessage(recipients: string[], title: string, message: string, userId: string) {
    await this.auditLogger.log({
      userId,
      resource: "marketing_messages",
      action: "create",
      entityId: "bulk-message",
      description: `Message sent to ${recipients.length} recipients`,
    });
    return { statusCode: 200, message: "Message sent", recipients: recipients.length };
  }
}
