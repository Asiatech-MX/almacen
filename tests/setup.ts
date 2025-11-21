import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database configuration
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/almacen_test';

// Note: jest.setTimeout is not needed here as Jest globals are configured in jest.config.mjs