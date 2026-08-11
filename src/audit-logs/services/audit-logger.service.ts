import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Request } from 'express';

/**
 * Audit Logger Service
 *
 * Centralized service for logging administrative actions
 * Used by all admin controllers/services
 *
 * @example
 * // In a service
 * await this.auditLogger.log({
 *   userId: user.id,
 *   resource: 'products',
 *   action: 'update',
 *   entityId: product.id,
 *   changes: [
 *     { field: 'price', old_value: 99.99, new_value: 129.99 }
 *   ],
 *   description: 'Admin updated product price'
 * }, request);
 */
@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an administrative action
   *
   * @param data Action details
   * @param request Express request object (for IP, user-agent)
   * @returns Created audit log record
   */
  async log(
    data: {
      userId: string;
      resource: string;
      action: string;
      entityId: string;
      changes?: Array<{ field: string; old_value: any; new_value: any }>;
      description?: string;
      httpMethod?: string;
      endpoint?: string;
      statusCode?: number;
    },
    request?: Request,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        admin_user_id: data.userId,
        resource: data.resource,
        action: data.action,
        entity_id: data.entityId,
        changes: data.changes || [],
        description: data.description || null,
        ip_address: request?.ip || null,
        user_agent: request?.get('user-agent') || null,
        http_method: data.httpMethod || request?.method || null,
        endpoint: data.endpoint || request?.path || null,
        status_code: data.statusCode || null,
      });

      const saved = await this.auditLogRepository.save(auditLog);

      // Log to console in development
      this.logger.debug(
        `[${data.action.toUpperCase()}] ${data.resource} - ${data.entityId}`,
        {
          userId: data.userId,
          changes: data.changes?.length || 0,
          description: data.description,
        },
      );

      return saved;
    } catch (error) {
      this.logger.error('Failed to log audit action', error);
      // Don't throw - logging failures shouldn't break the main operation
      return null;
    }
  }

  /**
   * Query audit logs with filters
   *
   * @param filters Search/filter criteria
   * @returns Paginated results
   */
  async findLogs(filters: {
    resource?: string;
    action?: string;
    userId?: string;
    entityId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let query = this.auditLogRepository.createQueryBuilder('audit_log');

    // Apply filters
    if (filters.resource) {
      query = query.andWhere('audit_log.resource = :resource', {
        resource: filters.resource,
      });
    }

    if (filters.action) {
      query = query.andWhere('audit_log.action = :action', {
        action: filters.action,
      });
    }

    if (filters.userId) {
      query = query.andWhere('audit_log.admin_user_id = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.entityId) {
      query = query.andWhere('audit_log.entity_id = :entityId', {
        entityId: filters.entityId,
      });
    }

    if (filters.dateFrom) {
      query = query.andWhere('audit_log.created_at >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query = query.andWhere('audit_log.created_at <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated data
    const data = await query
      .orderBy('audit_log.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log statistics
   *
   * @returns Statistics by resource and action
   */
  async getStatistics(): Promise<{
    total: number;
    byResource: Record<string, number>;
    byAction: Record<string, number>;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const total = await this.auditLogRepository.count();

    // By resource
    const byResourceQuery = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.resource, COUNT(*) as count')
      .groupBy('audit_log.resource')
      .getRawMany();

    const byResource = byResourceQuery.reduce(
      (acc, item) => {
        acc[item.resource] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    // By action
    const byActionQuery = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.action, COUNT(*) as count')
      .groupBy('audit_log.action')
      .getRawMany();

    const byAction = byActionQuery.reduce(
      (acc, item) => {
        acc[item.action] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Today
    const today = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('DATE(audit_log.created_at) = CURRENT_DATE')
      .getCount();

    // This week
    const thisWeek = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.created_at >= NOW() - INTERVAL \'7 days\'')
      .getCount();

    // This month
    const thisMonth = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.created_at >= NOW() - INTERVAL \'30 days\'')
      .getCount();

    return {
      total,
      byResource,
      byAction,
      today,
      thisWeek,
      thisMonth,
    };
  }

  /**
   * Export audit logs as JSON
   *
   * @param filters Query filters (same as findLogs)
   * @returns Array of audit logs for export
   */
  async export(filters?: {
    resource?: string;
    action?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditLog[]> {
    let query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (filters?.resource) {
      query = query.andWhere('audit_log.resource = :resource', {
        resource: filters.resource,
      });
    }

    if (filters?.action) {
      query = query.andWhere('audit_log.action = :action', {
        action: filters.action,
      });
    }

    if (filters?.userId) {
      query = query.andWhere('audit_log.admin_user_id = :userId', {
        userId: filters.userId,
      });
    }

    if (filters?.dateFrom) {
      query = query.andWhere('audit_log.created_at >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      query = query.andWhere('audit_log.created_at <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    return query.orderBy('audit_log.created_at', 'DESC').getMany();
  }

  /**
   * Delete old audit logs (data retention)
   *
   * @param daysToKeep Number of days to keep (default: 90)
   * @returns Number of deleted records
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - daysToKeep);

    const result = await this.auditLogRepository.delete({
      created_at: LessThan(date),
    });

    this.logger.log(
      `Deleted ${result.affected} audit logs older than ${daysToKeep} days`,
    );
    return result.affected || 0;
  }

  /**
   * Clear all audit logs (DANGER - only for dev/testing)
   */
  async clearAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear audit logs in production');
    }

    await this.auditLogRepository.clear();
    this.logger.warn('⚠️ All audit logs cleared');
  }
}

// Import LessThan from typeorm
import { LessThan } from 'typeorm';
