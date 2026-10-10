# TLOS: The Market - Investment Simulation

A full-stack interactive web application for managing the "TLOS: The Market" investment simulation game. Built with Next.js 14, React, TailwindCSS, Prisma, and Auth.js.

## 1. Game Setup & Rules

- **Teams:** Supports multiple competing teams via a secure, admin-controlled login system.
- **Starting Capital:** Each team begins with **₹10,00,000** (10 Lakhs) liquid cash.
- **Initial Stock Pool:** There are 6 fictional companies in the market, each starting with 10,000 shares at a base price of **₹1000/share**:
  1. NOVA (AI & Tech)
  2. VOLT (EV Vehicles)
  3. MEDIX (Healthcare)
  4. FINCO (Banking)
  5. FRESH (FMCG)
  6. SHIPX (Logistics)
- **Initial Phase:** Teams buy their starting stock allocations at ₹1000/share using their ₹10L capital. Total purchases cannot exceed the balance. Any remaining amount stays as Cash Reserve.

## 2. The 4 Phases of Play

### Phase 1: The 3 Good Events (Growth Opportunities)
The market presents 3 positive scenarios. For each event, teams pick one strategic response.
- **Aggressive:** High cash cost, highest potential stock multiplier.
- **Moderate:** Medium cash cost, moderate multiplier.
- **Pass:** Zero cost, zero multiplier.
*(Note: Outcomes and multipliers remain hidden from players until the Admin reveals the phase results).*

### Phase 2: The 3 Bad Events (Market Shocks)
The market takes a downturn with 3 crisis scenarios. Teams choose how to protect their portfolio:
- **Hold:** Take the hit. The stock price drops. Zero cash cost.
- **Exit (Liquidate):** Sell all shares of that company instantly at the current price to save cash.
- **Double Down / Hedge / Pivot:** Pay a high cash cost to turn the crisis into an opportunity, forcing the stock to rebound.

### Phase 3: Final Big Decision (Cash Deployment)
Teams must deploy any remaining liquid cash in one final strategy:
- **Safe Strategy:** Guaranteed +5% yield on remaining cash.
- **Balanced Strategy:** +12% yield on remaining cash.
- **Aggressive Strategy:** +25% yield on remaining cash.

### Phase 4: Final Leaderboard (End Game)
The Admin ends the game, revealing the final leaderboard. The team with the highest Final Total Portfolio Value wins.

**Scoring Formulas:**
- Holding Value = Remaining Shares Held × Final Share Price
- Total Portfolio Value = Final Cash Balance + Sum of all Holding Values
- ROI % = ((Total Portfolio Value - ₹10,00,000) / ₹10,00,000) × 100

## 3. Architecture & Interfaces

1. **Admin Panel (`/admin`):**
   - The Admin creates new teams and provides them with credentials (there is no public sign-up).
   - Allows the moderator to freeze trading, switch phases, resolve events (calculating math), and audit team decisions.
   
2. **Main Board (`/board`):**
   - Intended to be projected on the main hall screen. 
   - Displays live breaking news scenarios and the final expandable Leaderboard.

3. **Participant Terminal (`/terminal`):**
   - A secure, minimalist client where teams log in to make trades and submit event decisions.
   - Strict server-side cash validation prevents cheating.

## 4. Setup & Deployment (Next.js 14 App Router)

### Environment Variables
You must create a `.env.local` (for local development) with the following keys. In production (like Vercel), add these to your Project Settings:
```env
DATABASE_URL="postgres://your-postgres-url"
AUTH_SECRET="a-secure-random-string-for-nextauth"
```

### Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Initialize Database & Seed Data:**
   *(Ensure your PostgreSQL database is running and `DATABASE_URL` is set)*
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run the Server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Security Notes
- Public sign-ups are disabled by design.
- To set up your first **Admin account**, you can use Prisma Studio (`npx prisma studio`) to manually create a user in the `User` table with `role: "ADMIN"`. Once logged in, you can create the rest of the teams via the UI.
- 
