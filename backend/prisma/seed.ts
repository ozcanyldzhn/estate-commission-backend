import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ozcan = await prisma.user.upsert({
    where: { email: 'ozcan@example.com' },
    update: {},
    create: { email: 'ozcan@example.com', name: 'Özcan Yıldızhan' },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User' },
  });

  // Helper to create transaction with decimal strings per schema
  async function createTx(args: {
    userId: string; propertyId: string; propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND';
    grossPrice: number; commissionRatePct: number; currency?: string;
    stage?: 'AGREEMENT' | 'EARNEST_MONEY' | 'TITLE_DEED' | 'COMPLETED';
    listingAgentId: string; sellingAgentId: string;
  }) {
    const commissionAmount = args.grossPrice * (args.commissionRatePct / 100);
    await prisma.transaction.create({
      data: {
        userId: args.userId,
        propertyId: args.propertyId,
        propertyType: args.propertyType,
        grossPrice: args.grossPrice.toFixed(2),
        commissionRate: args.commissionRatePct.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        currency: args.currency ?? 'TRY',
        stage: args.stage ?? 'AGREEMENT',
        listingAgentId: args.listingAgentId,
        sellingAgentId: args.sellingAgentId,
      }
    });
  }

  await createTx({
    userId: ozcan.id,
    propertyId: 'P-1001',
    propertyType: 'RESIDENTIAL',
    grossPrice: 2_500_000.00,
    commissionRatePct: 3.00,
    listingAgentId: 'a-1',
    sellingAgentId: 'a-1',
  });

  await createTx({
    userId: demo.id,
    propertyId: 'P-2002',
    propertyType: 'COMMERCIAL',
    grossPrice: 900_000.00,
    commissionRatePct: 3.00,
    listingAgentId: 'a-2',
    sellingAgentId: 'a-3',
  });

  console.log('Seed completed', { demoUserId: demo.id });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


