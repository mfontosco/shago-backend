import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRbacSystem1000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'resource',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            isNullable: true,
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

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
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
      }),
      true,
    );

    // Create role_permissions junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permission_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_role_permission_pk',
            columnNames: ['role_id', 'permission_id'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys to role_permissions
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
      }),
    );

    // Add role_id column to users table if it doesn't already exist
    try {
      await queryRunner.addColumn(
        'users',
        new (require('typeorm').TableColumn)({
          name: 'role_id',
          type: 'uuid',
          isNullable: true,
        }),
      );
    } catch (e: any) {
      // Column already exists, skip
      if (!e.message.includes('already exists')) throw e;
    }

    // Add foreign key from users to roles (if not already exists)
    let foreignKeyExists = false;
    const userTable = await queryRunner.getTable('users');
    if (userTable && userTable.foreignKeys.some(fk => fk.columnNames.includes('role_id'))) {
      foreignKeyExists = true;
    }

    if (!foreignKeyExists) {
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          columnNames: ['role_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'roles',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key from users to roles
    const userTable = await queryRunner.getTable('users');
    if (userTable) {
      const userRoleForeignKey = userTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('role_id') !== -1,
      );
      if (userRoleForeignKey) {
        await queryRunner.dropForeignKey('users', userRoleForeignKey);
      }
    }

    // Drop role_id column from users
    await queryRunner.dropColumn('users', 'role_id');

    // Drop role_permissions table
    await queryRunner.dropTable('role_permissions');

    // Drop roles table
    await queryRunner.dropTable('roles');

    // Drop permissions table
    await queryRunner.dropTable('permissions');
  }
}
