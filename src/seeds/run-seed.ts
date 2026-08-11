import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../common/seeds/seed.service';

/**
 * Database Seeding Script
 *
 * Run with: npm run seed
 *
 * This script:
 * 1. Connects to the database
 * 2. Creates default roles and permissions
 * 3. Exits successfully
 *
 * Safe to run multiple times (won't create duplicates)
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn'],
    });

    const seedService = app.get(SeedService);
    await seedService.seed();

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
