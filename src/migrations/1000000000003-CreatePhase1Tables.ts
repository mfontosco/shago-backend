import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreatePhase1Tables1000000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table (required by all multi-tenant entities)
    await queryRunner.createTable(
      new Table({
        name: "tenants",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "email",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "phone",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "address",
            type: "text",
            isNullable: true,
          },
          {
            name: "city",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            default: "'active'",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create orders table (required by payments)
    await queryRunner.createTable(
      new Table({
        name: "orders",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "customer_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "order_number",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            default: "'pending'",
          },
          {
            name: "total_amount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add foreign key for orders.tenant_id
    await queryRunner.createForeignKey(
      "orders",
      new TableForeignKey({
        columnNames: ["tenant_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "tenants",
        onDelete: "CASCADE",
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      "tenants",
      new TableIndex({
        columnNames: ["id"],
      })
    );

    await queryRunner.createIndex(
      "orders",
      new TableIndex({
        columnNames: ["tenant_id"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("orders", true);
    await queryRunner.dropTable("tenants", true);
  }
}
