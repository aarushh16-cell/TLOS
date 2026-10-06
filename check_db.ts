import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const teams = await prisma.team.findMany({ include: { portfolio: true } });
  for (const t of teams) {
    if (t.balance < 0) console.log(`Team ${t.name} has negative balance: ${t.balance}`);
    for (const p of t.portfolio) {
      if (p.shares < 0) console.log(`Team ${t.name} has negative shares of ${p.stockSymbol}: ${p.shares}`);
      if (p.currentPrice < 0) console.log(`Team ${t.name} has negative price of ${p.stockSymbol}: ${p.currentPrice}`);
    }
  }
  const stocks = await prisma.stock.findMany();
  for (const s of stocks) {
    if (s.availableShares < 0) console.log(`Stock ${s.symbol} has negative available: ${s.availableShares}`);
    if (s.currentPrice < 0) console.log(`Stock ${s.symbol} has negative price: ${s.currentPrice}`);
  }
}
check();
