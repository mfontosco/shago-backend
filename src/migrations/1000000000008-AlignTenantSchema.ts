import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignTenantSchema1000000000008 implements MigrationInterface {
    name = 'AlignTenantSchema1000000000008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns using raw SQL - simpler and more reliable
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "description" TEXT`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "country" VARCHAR(20)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(20)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan" VARCHAR(50)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "max_users" INTEGER DEFAULT 100`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "max_products" INTEGER DEFAULT 1000`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "max_orders" INTEGER DEFAULT 10000`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "settings" TEXT`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deleted_at" VARCHAR(255)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "total_users" INTEGER DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "total_products" INTEGER DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "total_orders" INTEGER DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "total_deliveries" INTEGER DEFAULT 0`);

        // Add indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tenants_slug" ON "tenants" ("slug")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tenants_status_created" ON "tenants" ("status", "created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_status_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_slug"`);

        // Drop columns
        const cols = [
            "slug", "description", "logo_url", "website", "country", "currency",
            "plan", "subscription_expires_at", "max_users", "max_products",
            "max_orders", "is_active", "settings", "deleted_at", "total_users",
            "total_products", "total_orders", "total_deliveries"
        ];

        for (const col of cols) {
            await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "${col}"`);
        }
    }
}
