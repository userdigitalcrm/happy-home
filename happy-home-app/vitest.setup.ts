import '@testing-library/jest-dom'
import { execSync } from 'child_process'

// Use in-memory SQLite for tests
process.env.DATABASE_URL = 'file:memory:?cache=shared'
process.env.NODE_ENV = 'test'

// Push Prisma schema to the in-memory DB once before any test suites run
try {
  execSync('npx prisma db push --force --skip-generate', { stdio: 'ignore' })
} catch (e) {
  console.error('Prisma db push failed', e)
}

import { prisma } from '@/lib/prisma'

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect()
})