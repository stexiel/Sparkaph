#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

async function clearMigrations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Clearing all migration records...');
    
    const result = await prisma.$executeRawUnsafe(`TRUNCATE TABLE "_prisma_migrations";`);
    
    console.log('✅ All migration records cleared!');
    process.exit(0);
  } catch (error) {
    console.log('⚠️ Clear failed:', error.message);
    process.exit(0); // Продолжаем в любом случае
  } finally {
    await prisma.$disconnect();
  }
}

clearMigrations();
