import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSupportModule1000000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create support_tickets table
    await queryRunner.createTable(
      new Table({
        name: 'support_tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: "'open'",
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'",
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'assigned_to',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_support_tickets_tenant_status',
            columnNames: ['tenant_id', 'status'],
          }),
          new TableIndex({
            name: 'IDX_support_tickets_tenant_created',
            columnNames: ['tenant_id', 'created_at'],
          }),
        ],
      }),
      true,
    );

    // Add foreign keys for support_tickets
    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create support_replies table
    await queryRunner.createTable(
      new Table({
        name: 'support_replies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticket_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'attachment_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_internal',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for support_replies
    await queryRunner.createForeignKey(
      'support_replies',
      new TableForeignKey({
        columnNames: ['ticket_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'support_tickets',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'support_replies',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const supportRepliesTable = await queryRunner.getTable('support_replies');
    const supportTicketsTable = await queryRunner.getTable('support_tickets');

    if (supportRepliesTable) {
      const ticketFk = supportRepliesTable.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'ticket_id',
      );
      const userFk = supportRepliesTable.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'user_id',
      );

      if (ticketFk) await queryRunner.dropForeignKey('support_replies', ticketFk);
      if (userFk) await queryRunner.dropForeignKey('support_replies', userFk);

      await queryRunner.dropTable('support_replies');
    }

    if (supportTicketsTable) {
      const tenantFk = supportTicketsTable.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'tenant_id',
      );
      const userFk = supportTicketsTable.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'user_id',
      );

      if (tenantFk) await queryRunner.dropForeignKey('support_tickets', tenantFk);
      if (userFk) await queryRunner.dropForeignKey('support_tickets', userFk);

      await queryRunner.dropTable('support_tickets');
    }
  }
}


