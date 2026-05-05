const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const result = await prisma.kiosk.findFirst();
    console.log('✅ DB CONNECTION OK');
    console.log('First kiosk:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('❌ DB ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
