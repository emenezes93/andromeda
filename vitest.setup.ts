// Set test env before any module loads env
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/anamnese';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-min-32-characters-long!!!!!!!!!';
process.env.NODE_ENV = 'test';
