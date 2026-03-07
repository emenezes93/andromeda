// Load .env so DATABASE_URL (e.g. localhost:15432 for Docker) is used when running tests
import dotenv from 'dotenv';
dotenv.config();

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/anamnese';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-min-32-characters-long!!!!!!!!!';
process.env.NODE_ENV = 'test';
