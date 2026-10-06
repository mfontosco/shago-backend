import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePaymentsModule1000000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_methods table
    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
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
            name: 'payment_type',
            type: 'enum',
            enum: ['bank_transfer', 'mobile_money', 'card', 'wallet'],
            isNullable: false,
          },
          {
            name: 'account_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'account_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mobile_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'card_last_four',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Create indices for payment_methods
    await queryRunner.createIndex(
      'payment_methods',
      new TableIndex({
        columnNames: ['tenant_id'],
        name: 'idx_payment_methods_tenant_id',
      }),
    );

    // Create foreign key for payment_methods -> tenants
    await queryRunner.createForeignKey(
      'payment_methods',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    // Create payouts table
    await queryRunner.createTable(
      new Table({
        name: 'payouts',
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
            name: 'payment_method_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'reference_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
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

    // Create indices for payouts
    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        columnNames: ['tenant_id', 'status'],
        name: 'idx_payouts_tenant_status',
      }),
    );

    await queryRunner.createIndex(
      'payouts',
      new TableIndex({
        columnNames: ['tenant_id', 'created_at'],
        name: 'idx_payouts_tenant_created_at',
      }),
    );

    // Create foreign keys for payouts
    await queryRunner.createForeignKey(
      'payouts',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payouts',
      new TableForeignKey({
        columnNames: ['payment_method_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_methods',
        onDelete: 'SET NULL',
      }),
    );

    // Create transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
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
            name: 'order_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['payment', 'refund', 'adjustment', 'bonus', 'fee'],
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['completed', 'pending', 'failed'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'reference_id',
            type: 'varchar',
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

    // Create indices for transactions
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        columnNames: ['tenant_id', 'type'],
        name: 'idx_transactions_tenant_type',
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        columnNames: ['tenant_id', 'created_at'],
        name: 'idx_transactions_tenant_created_at',
      }),
    );

    // Create foreign keys for transactions
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['order_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'orders',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop transactions table
    await queryRunner.dropTable('transactions', true);

    // Drop payouts table
    await queryRunner.dropTable('payouts', true);

    // Drop payment_methods table
    await queryRunner.dropTable('payment_methods', true);
  }
}


