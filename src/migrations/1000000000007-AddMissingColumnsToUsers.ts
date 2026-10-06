import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMissingColumnsToUsers1000000000007 implements MigrationInterface {
    name = 'AddMissingColumnsToUsers1000000000007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tenant_id column if it doesn't exist
        const table = await queryRunner.getTable("users");
        if (!table?.findColumnByName('tenant_id')) {
            await queryRunner.addColumn("users", new TableColumn({
                name: "tenant_id",
                type: "uuid",
                isNullable: true,
            }));
        }

        // Add role_id column if it doesn't exist
        if (!table?.findColumnByName('role_id')) {
            await queryRunner.addColumn("users", new TableColumn({
                name: "role_id",
                type: "varchar",
                isNullable: true,
            }));
        }

        // Add indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_6b0ffa3308d0e17f62c4cedc6e" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f8e2e8f5f8e8f5f8e2e8f5f8e2" ON "users" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_7a52f5a1e8e8e8e8e8e8e8e8e8" ON "users" ("tenant_id", "active")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("users", "IDX_7a52f5a1e8e8e8e8e8e8e8e8e8");
        await queryRunner.dropIndex("users", "IDX_f8e2e8f5f8e8f5f8e2e8f5f8e2");
        await queryRunner.dropIndex("users", "IDX_6b0ffa3308d0e17f62c4cedc6e");

        const table = await queryRunner.getTable("users");
        if (table?.findColumnByName('role_id')) {
            await queryRunner.dropColumn("users", "role_id");
        }
        if (table?.findColumnByName('tenant_id')) {
            await queryRunner.dropColumn("users", "tenant_id");
        }
    }
}
