import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780487677399 implements MigrationInterface {
    name = 'Migration1780487677399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "catgeories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "slug" character varying, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_75b1d41d95a96319b7c60aed3a2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "catgeories"`);
    }

}
