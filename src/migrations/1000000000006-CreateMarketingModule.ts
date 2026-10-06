import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMarketingModule1000000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create campaigns table
    await queryRunner.createTable(
      new Table({
        name: 'campaigns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'draft', 'paused', 'completed', 'cancelled'],
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'campaign_type',
            type: 'enum',
            enum: ['seasonal', 'promotional', 'flash_sale', 'loyalty', 'referral'],
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'budget',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'discount_percentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'min_order_value',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'usage_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'usage_limit',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'target_audience',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indices for campaigns
    await queryRunner.createIndex(
      'campaigns',
      new TableIndex({
        columnNames: ['tenant_id', 'status'],
        name: 'idx_campaigns_tenant_status',
      }),
    );

    await queryRunner.createIndex(
      'campaigns',
      new TableIndex({
        columnNames: ['tenant_id', 'created_at'],
        name: 'idx_campaigns_tenant_created_at',
      }),
    );

    // Create foreign key for campaigns -> tenants
    await queryRunner.createForeignKey(
      'campaigns',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create coupons table
    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'campaign_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'code',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'discount_type',
            type: 'enum',
            enum: ['percentage', 'fixed_amount', 'free_shipping'],
            isNullable: false,
          },
          {
            name: 'discount_value',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'min_order_value',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'valid_from',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'valid_until',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'usage_limit',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'usage_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'max_usage_per_customer',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'expired'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'applicable_products',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'applicable_categories',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indices for coupons
    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        columnNames: ['tenant_id', 'status'],
        name: 'idx_coupons_tenant_status',
      }),
    );

    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        columnNames: ['tenant_id', 'created_at'],
        name: 'idx_coupons_tenant_created_at',
      }),
    );

    // Create foreign keys for coupons
    await queryRunner.createForeignKey(
      'coupons',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'coupons',
      new TableForeignKey({
        columnNames: ['campaign_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaigns',
        onDelete: 'SET NULL',
      }),
    );

    // Create marketing_templates table
    await queryRunner.createTable(
      new Table({
        name: 'marketing_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'template_type',
            type: 'enum',
            enum: [
              'email_promotion',
              'sms_notification',
              'push_notification',
              'in_app_banner',
              'newsletter',
            ],
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'call_to_action_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'call_to_action_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'scheduled', 'archived'],
            default: "'draft'",
            isNullable: false,
          },
          {
            name: 'scheduled_send_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'send_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'open_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'click_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'open_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'click_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indices for marketing_templates
    await queryRunner.createIndex(
      'marketing_templates',
      new TableIndex({
        columnNames: ['tenant_id', 'template_type'],
        name: 'idx_marketing_templates_tenant_type',
      }),
    );

    await queryRunner.createIndex(
      'marketing_templates',
      new TableIndex({
        columnNames: ['tenant_id', 'created_at'],
        name: 'idx_marketing_templates_tenant_created_at',
      }),
    );

    // Create foreign key for marketing_templates -> tenants
    await queryRunner.createForeignKey(
      'marketing_templates',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop marketing_templates table
    await queryRunner.dropTable('marketing_templates', true);

    // Drop coupons table
    await queryRunner.dropTable('coupons', true);

    // Drop campaigns table
    await queryRunner.dropTable('campaigns', true);
  }
}


