# Backend Developer Checklist

**Use this checklist when implementing new features/endpoints**

---

## Before Starting

- [ ] Read [API_QUICK_START.md](./API_QUICK_START.md)
- [ ] Understand the feature from design document
- [ ] Check for existing similar implementations
- [ ] Create feature branch: `git checkout -b feat/feature-name`

---

## Creating New Endpoint

### 1. Create/Update DTO

- [ ] Create `src/feature/dtos/create-feature.dto.ts`
- [ ] Create `src/feature/dtos/update-feature.dto.ts` (if applicable)
- [ ] Add validation decorators:
  - [ ] `@IsString()`, `@IsNumber()`, `@IsEmail()`, etc.
  - [ ] `@MinLength()`, `@MaxLength()`, `@Min()`, `@Max()`
  - [ ] `@IsOptional()` for optional fields
  - [ ] `@IsUUID()` for ID references
- [ ] Add helpful error messages to decorators
- [ ] Example:
  ```typescript
  export class CreateFeatureDto {
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters' })
    name: string;

    @IsNumber()
    @Min(0, { message: 'Price must be 0 or greater' })
    price: number;
  }
  ```

### 2. Create Service

- [ ] Create `src/feature/feature.service.ts`
- [ ] Add `@Injectable()` decorator
- [ ] Inject `Repository` for entity
- [ ] Implement business logic methods:
  - [ ] `create(dto)` - Create new record
  - [ ] `findAll()` - List all records
  - [ ] `findOne(id)` - Get single record
  - [ ] `update(id, dto)` - Update record
  - [ ] `delete(id)` - Delete record (soft delete)
- [ ] Add error handling:
  - [ ] Throw `NotFoundException` if record not found
  - [ ] Throw `BadRequestException` for validation errors
  - [ ] Throw `ConflictException` for duplicates
- [ ] Add business logic validation
- [ ] Example:
  ```typescript
  @Injectable()
  export class FeatureService {
    constructor(
      @InjectRepository(Feature) private repo: Repository<Feature>,
    ) {}

    async create(dto: CreateFeatureDto): Promise<Feature> {
      const exists = await this.repo.findOne({ where: { name: dto.name } });
      if (exists) {
        throw new ConflictException('Feature already exists');
      }
      return this.repo.save(this.repo.create(dto));
    }

    async findOne(id: string): Promise<Feature> {
      const feature = await this.repo.findOne({ where: { id } });
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }
      return feature;
    }
  }
  ```

### 3. Create Controller

- [ ] Create `src/feature/feature.controller.ts`
- [ ] Add `@Controller('features')` decorator
- [ ] Add `@UseGuards()` for protected endpoints
- [ ] Add `@Roles()` for role-based access
- [ ] Implement endpoints:
  - [ ] `@Get()` - List with pagination
  - [ ] `@Get(':id')` - Get single
  - [ ] `@Post()` - Create (admin only)
  - [ ] `@Patch(':id')` - Update (admin only)
  - [ ] `@Delete(':id')` - Delete (admin only)
- [ ] Add `@Body()`, `@Param()`, `@Query()` decorators
- [ ] Use consistent response format:
  ```typescript
  {
    statusCode: 200,
    message: 'Success',
    data: [...],
    pagination?: { ... }
  }
  ```
- [ ] Example:
  ```typescript
  @Controller('features')
  export class FeatureController {
    constructor(private service: FeatureService) {}

    @Get()
    async list() {
      return {
        statusCode: 200,
        message: 'Success',
        data: await this.service.findAll(),
      };
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async create(@Body() dto: CreateFeatureDto) {
      return {
        statusCode: 201,
        message: 'Created',
        data: await this.service.create(dto),
      };
    }

    @Get(':id')
    async getOne(@Param('id', ParseUUIDPipe) id: string) {
      return {
        statusCode: 200,
        message: 'Success',
        data: await this.service.findOne(id),
      };
    }
  }
  ```

### 4. Create Module

- [ ] Create `src/feature/feature.module.ts`
- [ ] Import `TypeOrmModule.forFeature([Feature])`
- [ ] Declare service and controller
- [ ] Export service if other modules need it
- [ ] Example:
  ```typescript
  @Module({
    imports: [TypeOrmModule.forFeature([Feature])],
    controllers: [FeatureController],
    providers: [FeatureService],
    exports: [FeatureService],
  })
  export class FeatureModule {}
  ```

### 5. Update App Module

- [ ] Import new module in `src/app.module.ts`
- [ ] Add to imports array
- [ ] Verify TypeORM entity is imported in AppModule
- [ ] Example:
  ```typescript
  // In app.module.ts imports
  FeatureModule,
  
  // In TypeOrmModule.forRootAsync
  entities: [..., Feature],
  ```

### 6. Create Database Entity

- [ ] Create `src/feature/entities/feature.entity.ts`
- [ ] Add `@Entity()` decorator
- [ ] Add fields with decorators:
  - [ ] `@PrimaryGeneratedColumn('uuid')` for ID
  - [ ] `@Column()` for fields
  - [ ] `@CreateDateColumn()` for timestamps
  - [ ] `@UpdateDateColumn()` for updates
  - [ ] `@DeleteDateColumn()` for soft deletes
  - [ ] Relationships: `@ManyToOne()`, `@ManyToMany()`, etc.
- [ ] Add indexes on frequently queried columns
- [ ] Example:
  ```typescript
  @Entity('features')
  export class Feature {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    enabled: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
  }
  ```

### 7. Create Database Migration

- [ ] Generate migration:
  ```bash
  npm run migration:generate -- CreateFeaturesTable
  ```
- [ ] Review generated migration in `src/migrations/`
- [ ] Verify SQL looks correct
- [ ] Run migration:
  ```bash
  npm run migration:run
  ```
- [ ] Test rollback:
  ```bash
  npm run migration:revert
  npm run migration:run
  ```

---

## Adding Tests

### 1. Create Service Tests

- [ ] Create `src/feature/feature.service.spec.ts`
- [ ] Test each method:
  - [ ] Happy path (success case)
  - [ ] Error cases (not found, validation error, etc.)
  - [ ] Edge cases
- [ ] Example:
  ```typescript
  describe('FeatureService', () => {
    let service: FeatureService;
    let repo: Repository<Feature>;

    beforeEach(async () => {
      // Setup test module and inject mocks
    });

    it('should create feature', async () => {
      const dto = { name: 'Test', description: 'Test' };
      const result = await service.create(dto);
      expect(result.name).toBe('Test');
    });

    it('should throw ConflictException on duplicate', async () => {
      // Create first
      await service.create({ name: 'Test' });
      // Try duplicate
      await expect(service.create({ name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });
  ```

### 2. Create Controller Tests

- [ ] Create `src/feature/feature.controller.spec.ts`
- [ ] Test each endpoint:
  - [ ] Verify HTTP method
  - [ ] Verify response format
  - [ ] Verify status codes
  - [ ] Verify role guards work
- [ ] Mock service and database

### 3. Create E2E Tests

- [ ] Create `test/feature.e2e-spec.ts`
- [ ] Test full flow:
  - [ ] Unauthenticated access
  - [ ] Wrong role access
  - [ ] Valid access
- [ ] Test with real database

### 4. Run All Tests

```bash
npm run test                # All unit tests
npm run test:cov           # With coverage
npm run test:e2e           # E2E tests
```

- [ ] Verify test coverage > 80%
- [ ] Fix any failing tests

---

## Code Quality

### 1. Linting

- [ ] Run linter:
  ```bash
  npm run lint
  ```
- [ ] Fix issues:
  ```bash
  npm run format
  ```
- [ ] No console.log (use logger)
- [ ] No commented code
- [ ] Remove unused imports

### 2. Code Review

- [ ] No hardcoded values (use env vars)
- [ ] No SQL queries (use ORM)
- [ ] No exposed sensitive data
- [ ] Error messages are user-friendly
- [ ] Code is readable and well-commented
- [ ] Similar patterns used across codebase

### 3. Performance

- [ ] Database queries optimized
- [ ] No N+1 queries (use eager loading)
- [ ] Response time < 200ms
- [ ] Large datasets are paginated
- [ ] Indexes on frequently queried columns

---

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] Role check with `@Roles()`
- [ ] Error responses don't expose internals
- [ ] No hardcoded secrets
- [ ] SQL injection prevented (ORM protects this)
- [ ] XSS prevention (auto sanitized)
- [ ] CSRF prevention (stateless API, no cookies)
- [ ] Rate limiting ready (middleware available)
- [ ] Soft deletes used (GDPR compliant)

---

## Documentation

- [ ] Add JSDoc comments to public methods
- [ ] Document DTO fields
- [ ] Add endpoint description to README
- [ ] Update API documentation (if exists)
- [ ] Add examples of usage
- [ ] Example:
  ```typescript
  /**
   * Create a new feature
   * 
   * @param dto Feature creation data
   * @returns Created feature with ID
   * @throws ConflictException if feature already exists
   * 
   * @example
   * const feature = await this.service.create({
   *   name: 'Dark Mode',
   *   description: 'Enable dark theme'
   * });
   */
  async create(dto: CreateFeatureDto): Promise<Feature> {
    // ...
  }
  ```

---

## Before Committing

- [ ] All tests passing: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] No console.log statements
- [ ] Database migration reviewed
- [ ] Feature works as expected
- [ ] No breaking changes to existing APIs

---

## Git Workflow

```bash
# 1. Create branch
git checkout -b feat/feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: Add feature description"

# 3. Push branch
git push origin feat/feature-name

# 4. Create Pull Request
# - Add detailed description
# - Link related issues
# - Add test results

# 5. After review/approval
git merge feat/feature-name

# 6. Delete branch
git push origin --delete feat/feature-name
```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Put logic in controllers
- Skip input validation
- Use hardcoded values
- Write raw SQL queries
- Expose error stack traces
- Skip tests
- Use deprecated methods
- Ignore database indexes
- Return sensitive data

✅ **Do:**
- Keep controllers thin
- Validate all inputs
- Use environment variables
- Use TypeORM Query Builder
- Sanitize error messages
- Write tests first (TDD)
- Use latest NestJS patterns
- Index frequently queried columns
- Return only necessary data

---

## Useful Commands

```bash
# Development
npm run start:dev              # Start with watch mode
npm run start:debug           # Debug mode

# Testing
npm run test                  # Run tests
npm run test:watch           # Watch mode
npm run test:cov             # Coverage report

# Database
npm run migration:generate    # Generate migration
npm run migration:run         # Run migrations
npm run migration:revert      # Revert last migration
npm run migration:show        # Show status

# Code quality
npm run lint                  # Check linting
npm run format                # Format code

# Database seeding
npm run seed                  # Seed default data
```

---

## Resources

- **NestJS Docs:** https://docs.nestjs.com/
- **TypeORM Docs:** https://typeorm.io/
- **API Quick Start:** [API_QUICK_START.md](./API_QUICK_START.md)
- **System Design:** [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)

---

## When Done

- [ ] Create pull request
- [ ] Request code review
- [ ] Update CHANGELOG
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Deploy to production

---

## Support

If stuck:
1. Check documentation
2. Look at similar implementations
3. Check tests for examples
4. Ask in code review
5. Check NestJS docs

---

**Version:** 1.0  
**Last Updated:** August 10, 2026
