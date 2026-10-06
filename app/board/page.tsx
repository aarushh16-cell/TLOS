"use client";

import { useEffect, useState } from "react";
import { Activity, Trophy, TrendingUp, TrendingDown, Clock, ShieldAlert, Newspaper, ChevronDown, ChevronUp } from "lucide-react";

type Decision = { eventId: number, choice: string };
type Transaction = { stockSymbol: string, shares: number, type: string, priceAtTransaction: number };
type PortfolioItem = { stockSymbol: string, shares: number, stock: Stock };
type LeaderboardTeam = {
  id: string, name: string, balance: number, portfolioValue: number, totalValue: number,
  decisions: Decision[], transactions: Transaction[], portfolio: PortfolioItem[]
};
type Stock = {
  id: string, symbol: string, name: string, sector: string, currentPrice: number, riskProfile: string
};

const goodEvents = [
  { id: 1, target: 'NOVA', title: 'AI Product Expansion', options: [{ id: 'A', label: 'Aggressive', cost: 300000 }, { id: 'B', label: 'Moderate', cost: 150000 }, { id: 'C', label: 'Pass', cost: 0 }] },
  { id: 2, target: 'VOLT', title: 'Clean Energy Subsidy Grant', options: [{ id: 'A', label: 'Co-Invest', cost: 200000 }, { id: 'B', label: 'Standard', cost: 100000 }, { id: 'C', label: 'Pass', cost: 0 }] },
  { id: 3, target: 'FINCO', title: 'Enterprise Banking Contract Win', options: [{ id: 'A', label: 'Fund Scale-Up', cost: 250000 }, { id: 'B', label: 'Maintain Capacity', cost: 100000 }, { id: 'C', label: 'Pass', cost: 0 }] }
];

const badEvents = [
  { id: 4, target: 'NOVA', title: 'Data Privacy Regulation Shock', options: [{ id: 'A', label: 'HOLD', cost: 0 }, { id: 'B', label: 'EXIT (Liquidate)', cost: 0 }, { id: 'C', label: 'DOUBLE DOWN', cost: 100000 }] },
  { id: 5, target: 'SHIPX', title: 'Fuel Price Spike & Route Disruption', options: [{ id: 'A', label: 'HOLD', cost: 0 }, { id: 'B', label: 'EXIT (Liquidate)', cost: 0 }, { id: 'C', label: 'HEDGE', cost: 100000 }] },
  { id: 6, target: 'FRESH', title: 'Commodity Shortage Margin Squeeze', options: [{ id: 'A', label: 'HOLD', cost: 0 }, { id: 'B', label: 'EXIT (Liquidate)', cost: 0 }, { id: 'C', label: 'PIVOT', cost: 150000 }] }
];

const finalEvent = { id: 7, target: 'ALL', title: 'Deploy Remaining Cash Balance', options: [{ id: 'PATH_1', label: 'Safe Asset', cost: 0 }, { id: 'PATH_2', label: 'Balanced Fund', cost: 0 }, { id: 'PATH_3', label: 'Aggressive Growth Play', cost: 0 }] };

function AuditLog({ team, events }: { team: LeaderboardTeam, events: any[] }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="mt-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50 overflow-hidden text-left">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Audit Log</span>
        {open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      
      {open && (
        <div className="p-6 border-t border-zinc-700/50 space-y-6 text-sm">
           <div>
             <h4 className="font-bold text-zinc-300 mb-2 border-b border-zinc-700 pb-1">Initial Trades (Phase 0)</h4>
             {team.transactions.length > 0 ? (
               <ul className="space-y-1 font-mono text-zinc-400">
                 {team.transactions.map((t, i) => (
                   <li key={i}>{t.type} {t.shares} {t.stockSymbol} @ ₹{t.priceAtTransaction}</li>
                 ))}
               </ul>
             ) : <p className="text-zinc-500">No initial trades.</p>}
           </div>
           
           <div>
             <h4 className="font-bold text-zinc-300 mb-2 border-b border-zinc-700 pb-1">Strategic Decisions</h4>
             <ul className="space-y-2 font-mono text-zinc-400">
               {team.decisions.map((d, i) => {
                 const ev = events.find(e => e.id === d.eventId);
                 return (
                   <li key={i} className="flex justify-between">
                     <span>Event {d.eventId}: {ev?.title || 'Unknown'}</span>
                     <span className="text-blue-400 font-bold">[{d.choice}]</span>
                   </li>
                 )
               })}
               {team.decisions.length === 0 && <li className="text-zinc-500">No decisions made.</li>}
             </ul>
           </div>
           
           <div>
             <h4 className="font-bold text-zinc-300 mb-2 border-b border-zinc-700 pb-1">Final Portfolio Snapshot</h4>
             <ul className="space-y-1 font-mono text-zinc-400">
               {team.portfolio.map((p, i) => (
                 <li key={i}>{p.stockSymbol}: {p.shares} shares @ ₹{p.stock.currentPrice} = ₹{(p.shares * p.stock.currentPrice).toLocaleString()}</li>
               ))}
               <li>Liquid Cash: ₹{team.balance.toLocaleString()}</li>
               <li className="pt-2 font-bold text-white">Total Value: ₹{team.totalValue.toLocaleString()}</li>
               <li className="font-bold text-emerald-400">Net Profit: ₹{(team.totalValue - 1000000).toLocaleString()} ( {((team.totalValue - 1000000) / 1000000 * 100).toFixed(2)}% ROI )</li>
             </ul>
           </div>
        </div>
      )}
    </div>
  )
}

export default function BoardPage() {
  const [phase, setPhase] = useState("PORTFOLIO");
  const [leaderboard, setLeaderboard] = useState<LeaderboardTeam[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  
  const fetchState = () => {
    fetch('/api/admin/state').then(res => res.json()).then(data => {
      setPhase(data.phase || 'PORTFOLIO');
      setLeaderboard(data.leaderboards || []);
      setStocks(data.stocks || []);
    });
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const allEvents = [...goodEvents, ...badEvents, finalEvent];

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative">
      
      <header className="px-10 py-6 border-b border-zinc-800 flex justify-between items-center bg-black z-20">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">TLOS: THE MARKET</h1>
          <p className="text-zinc-400 font-mono mt-1 text-lg uppercase tracking-widest flex items-center gap-2">
            <Activity size={18} className="text-emerald-500"/> Live Simulation Board
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Current Phase</p>
          <p className="text-3xl font-black text-blue-500 tracking-tight">{phase.replace('_', ' ')}</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* PHASE VIEWS */}
        
        {(phase === 'PORTFOLIO' || phase === 'REVEAL_GOOD' || phase === 'REVEAL_BAD') && (
          <div className="flex-1 p-10 flex flex-col items-center justify-center">
             <h2 className="text-5xl font-black mb-16 tracking-tight text-center">Global Asset Valuation</h2>
             <div className="grid grid-cols-3 gap-8 w-full max-w-6xl">
               {stocks.map(s => (
                 <div key={s.symbol} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
                    <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">{s.sector}</span>
                    <h3 className="text-5xl font-black mb-6">{s.symbol}</h3>
                    <p className="text-6xl font-mono text-emerald-400 font-bold tracking-tighter mb-4">₹{s.currentPrice.toFixed(2)}</p>
                    <p className="text-zinc-400 text-lg">Company Valuation</p>
                    <p className="text-2xl font-mono font-bold text-white tracking-tight">₹{(s.currentPrice * 10000).toLocaleString()}</p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {phase === 'GOOD_EVENTS' && (
          <div className="flex-1 p-10 flex flex-col items-center justify-center bg-blue-900/10">
             <div className="flex items-center gap-4 mb-10">
               <Newspaper className="text-blue-500 w-16 h-16" />
               <h2 className="text-6xl font-black tracking-tight text-blue-100">Breaking News & Opportunities</h2>
             </div>
             
             <div className="w-full max-w-5xl space-y-8">
                {goodEvents.map((e, i) => (
                  <div key={e.id} className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-8 flex shadow-2xl">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black text-4xl mr-8 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-400 font-bold uppercase tracking-widest mb-1">Target Asset: {e.target}</p>
                      <h3 className="text-3xl font-black text-white mb-6 leading-tight">{e.title}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {e.options.map(o => (
                          <div key={o.id} className="bg-black/50 border border-zinc-800 p-4 rounded-lg flex flex-col items-center text-center">
                            <span className="text-sm font-bold text-zinc-500 mb-1">Option {o.id}</span>
                            <span className="text-xl font-bold text-white mb-2">{o.label}</span>
                            <span className="font-mono text-emerald-400 font-bold">Cost: ₹{o.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {phase === 'BAD_EVENTS' && (
          <div className="flex-1 p-10 flex flex-col items-center justify-center bg-red-900/10">
             <div className="flex items-center gap-4 mb-10">
               <ShieldAlert className="text-red-500 w-16 h-16 animate-pulse" />
               <h2 className="text-6xl font-black tracking-tight text-red-100">Market Shocks & Crises</h2>
             </div>
             
             <div className="w-full max-w-5xl space-y-8">
                {badEvents.map((e, i) => (
                  <div key={e.id} className="bg-zinc-900/80 border border-red-900/50 rounded-2xl p-8 flex shadow-2xl">
                    <div className="w-24 h-24 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-4xl mr-8 shrink-0">
                      {i + 4}
                    </div>
                    <div className="flex-1">
                      <p className="text-red-400/80 font-bold uppercase tracking-widest mb-1">Target Asset: {e.target}</p>
                      <h3 className="text-3xl font-black text-white mb-6 leading-tight">{e.title}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {e.options.map(o => (
                          <div key={o.id} className="bg-black/50 border border-red-900/30 p-4 rounded-lg flex flex-col items-center text-center">
                            <span className="text-sm font-bold text-red-500/70 mb-1">Option {o.id}</span>
                            <span className="text-xl font-bold text-white mb-2">{o.label}</span>
                            <span className="font-mono text-red-400 font-bold">Cost: ₹{o.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {phase === 'FINAL_DECISION' && (
          <div className="flex-1 p-10 flex flex-col items-center justify-center">
             <h2 className="text-6xl font-black tracking-tight mb-4">Phase 3: Final Deployment</h2>
             <p className="text-2xl text-zinc-400 mb-16">Teams must deploy remaining liquid cash reserves.</p>
             
             <div className="w-full max-w-5xl">
                <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 flex shadow-2xl">
                  <div className="flex-1">
                    <h3 className="text-4xl font-black text-white mb-10 text-center leading-tight">{finalEvent.title}</h3>
                    <div className="grid grid-cols-3 gap-6">
                      {finalEvent.options.map(o => (
                        <div key={o.id} className="bg-black border border-zinc-800 p-8 rounded-xl flex flex-col items-center text-center">
                          <span className="text-xl font-bold text-white mb-2">{o.label}</span>
                          <span className="text-zinc-500 text-sm mt-4">Fixed Yield Implementation</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {phase === 'END' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col items-center">
             <div className="flex items-center gap-4 mb-12 mt-10">
               <Trophy className="text-yellow-400 w-20 h-20" />
               <h2 className="text-7xl font-black tracking-tight text-white">Final Leaderboard</h2>
             </div>
             
             <div className="w-full max-w-5xl space-y-6">
               {leaderboard.map((team, idx) => {
                 const isWinner = idx === 0;
                 return (
                   <div key={team.id} className={`bg-zinc-900 border ${isWinner ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'border-zinc-800'} rounded-2xl p-8`}>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-8">
                           <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black ${isWinner ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                             {idx + 1}
                           </div>
                           <div>
                             {isWinner && <p className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-1 flex items-center gap-2"><Trophy size={14}/> Winner Crown</p>}
                             <h3 className="text-4xl font-black text-white">{team.name}</h3>
                           </div>
                         </div>
                         
                         <div className="text-right">
                           <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Portfolio Value</p>
                           <p className={`text-5xl font-mono font-black tracking-tight ${isWinner ? 'text-yellow-400' : 'text-emerald-400'}`}>
                             ₹{team.totalValue.toLocaleString()}
                           </p>
                           <p className="text-zinc-400 mt-2 font-mono text-sm">ROI: {((team.totalValue - 1000000) / 10000).toFixed(2)}%</p>
                         </div>
                      </div>
                      
                      {/* Audit Log component */}
                      <AuditLog team={team} events={allEvents} />
                   </div>
                 );
               })}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
