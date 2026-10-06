import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("Starting DB Seed...");
  // Clear existing
  await prisma.transaction.deleteMany()
  await prisma.portfolioItem.deleteMany()
  await prisma.teamDecision.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.stock.deleteMany()

  // Create Admin
  await prisma.user.create({
    data: {
      username: 'admin',
      password: 'adminpassword',
      role: 'ADMIN'
    }
  })

  // Create 30 Teams
  for (let i = 1; i <= 30; i++) {
    const user = await prisma.user.create({
      data: {
        username: `team${i}`,
        password: `team${i}pass`,
        role: 'TEAM'
      }
    })
    
    await prisma.team.create({
      data: {
        name: `Team ${i}`,
        balance: 1000000,
        userId: user.id
      }
    })
  }

  // Create the 6 Game Stocks
  const gameStocks = [
    { symbol: 'NOVA', name: 'NOVA (AI & Tech)', sector: 'AI & Tech', riskProfile: 'High Growth / High Risk' },
    { symbol: 'VOLT', name: 'VOLT (EV Vehicles)', sector: 'EV Vehicles', riskProfile: 'High Growth / Med Risk' },
    { symbol: 'MEDIX', name: 'MEDIX (Healthcare)', sector: 'Healthcare', riskProfile: 'Stable Growth / Med Risk' },
    { symbol: 'FINCO', name: 'FINCO (Banking)', sector: 'Banking', riskProfile: 'Cash-Flow Steady / Low Risk' },
    { symbol: 'FRESH', name: 'FRESH (FMCG)', sector: 'FMCG', riskProfile: 'Defensive / Low Growth' },
    { symbol: 'SHIPX', name: 'SHIPX (Logistics)', sector: 'Logistics', riskProfile: 'Macro-Linked / Med Risk' }
  ];

  for (const st of gameStocks) {
    const stock = await prisma.stock.create({
      data: {
        symbol: st.symbol,
        name: st.name,
        sector: st.sector,
        totalShares: 40000,
        availableShares: 40000,
        startPrice: 100,
        currentPrice: 100,
        riskProfile: st.riskProfile
      }
    })
    
    // Initial price history
    await prisma.priceHistory.create({
      data: {
        stockSymbol: stock.symbol,
        price: stock.currentPrice
      }
    })
  }

  console.log("Seeding complete: 30 Teams and 6 Game Stocks created.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
