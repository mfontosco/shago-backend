import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1000000000001 implements MigrationInterface {
    name = 'CreateUsersTable1000000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid, "fullName" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "active" boolean NOT NULL, "role_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6b0ffa3308d0e17f62c4cedc6e" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_f8e2e8f5f8e8f5f8e2e8f5f8e2" ON "users" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_7a52f5a1e8e8e8e8e8e8e8e8e8" ON "users" ("tenant_id", "active")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
