"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, Activity, ShieldAlert, BarChart3, Settings2, Power, Building, Trash2, Edit2, Plus, RefreshCcw } from "lucide-react";

type LeaderboardTeam = {
  id: string, name: string, balance: number, portfolioValue: number, totalValue: number, userId: string
};

type Stock = {
  id: string, symbol: string, name: string, sector: string, currentPrice: number, riskProfile: string
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [phase, setPhase] = useState("PORTFOLIO");
  const [isTradingEnabled, setIsTradingEnabled] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardTeam[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Stock Form
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [stockForm, setStockForm] = useState({ symbol: '', name: '', sector: '', currentPrice: 100, riskProfile: 'LOW' });

  const fetchState = () => {
    fetch('/api/admin/state', { cache: 'no-store' }).then(res => res.json()).then(data => {
      setPhase(data.phase || 'PORTFOLIO');
      setIsTradingEnabled(data.isTradingEnabled ?? true);
      setLeaderboard(data.leaderboards || []);
      setStocks(data.stocks || []);
    });
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const changePhase = async (newPhase: string) => {
    if (!confirm(`Change phase to ${newPhase}?`)) return;
    await fetch('/api/admin/phase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: newPhase }) });
    fetchState();
  };

  const toggleTrading = async () => {
    const newState = !isTradingEnabled;
    if (!confirm(`Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} market trading?`)) return;
    await fetch('/api/admin/trading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isTradingEnabled: newState }) });
    fetchState();
  };

  const resolvePhase = async (type: string) => {
    setIsLoading(true);
    const res = await fetch('/api/admin/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
    const data = await res.json();
    fetchState();
    setIsLoading(false);
    
    if (data.success) {
      alert(`Success! Processed ${data.processedDecisions} team decisions for ${type} phase.`);
    } else {
      alert(`Error processing resolutions: ${data.error}`);
    }
  };
  
  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to permanently delete team "${teamName}"?`)) return;
    setIsLoading(true);
    await fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId }) });
    fetchState();
    setIsLoading(false);
  };
  
  const resetPortfolio = async (teamId: string, teamName: string) => {
    if (!confirm(`Reset portfolio for ${teamName === 'ALL' ? 'ALL TEAMS' : `"${teamName}"`}? This will refund their 1M balance and return their shares to the global supply.`)) return;
    setIsLoading(true);
    await fetch('/api/admin/reset-portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId }) });
    fetchState();
    setIsLoading(false);
  };
  
  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = editingStock ? { id: editingStock.id, ...stockForm } : stockForm;
    await fetch('/api/admin/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowStockForm(false);
    setEditingStock(null);
    fetchState();
    setIsLoading(false);
  };
  
  const deleteStock = async (id: string, symbol: string) => {
    if (!confirm(`Delete stock ${symbol}?`)) return;
    setIsLoading(true);
    await fetch('/api/admin/stock', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchState();
    setIsLoading(false);
  }

  const openStockForm = (stock?: Stock) => {
    if (stock) {
      setEditingStock(stock);
      setStockForm({ symbol: stock.symbol, name: stock.name, sector: stock.sector, currentPrice: stock.currentPrice, riskProfile: stock.riskProfile });
    } else {
      setEditingStock(null);
      setStockForm({ symbol: '', name: '', sector: '', currentPrice: 100, riskProfile: 'LOW' });
    }
    setShowStockForm(true);
  }

  if (!session || !session.user || (session.user as any).role !== 'ADMIN') return <div className="p-8 text-red-500 font-mono h-screen bg-[var(--background)]">401 Unauthorized</div>;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-end pb-6 border-b border-[var(--border-color)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-zinc-400" /> Admin Control Center
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Manage global market state, teams, and assets.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-4 bg-[var(--panel-bg)] p-2 border border-[var(--border-color)] rounded-lg shadow-sm">
                <span className="text-xs text-zinc-500 uppercase font-semibold px-2">Market Switch:</span>
                <button 
                  onClick={toggleTrading} 
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-all ${isTradingEnabled ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  <Power size={14} /> {isTradingEnabled ? 'TRADING ACTIVE' : 'MARKET FROZEN'}
                </button>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEADERBOARD & TEAM MANAGEMENT */}
          <div className="xl:col-span-2 dashboard-panel flex flex-col h-[50vh]">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--panel-bg)] rounded-t-xl">
              <h2 className="text-base font-bold flex items-center gap-2"><Users size={18} className="text-zinc-400"/> Teams & Leaderboard</h2>
              <div className="flex gap-4 items-center">
                 <span className="text-xs text-zinc-500">{leaderboard.length} Teams Registered</span>
                 <button onClick={() => resetPortfolio('ALL', 'ALL')} className="text-xs px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/30 font-bold transition-all">Reset All Portfolios</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--panel-bg)] rounded-b-xl">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500 sticky top-0 bg-[var(--panel-bg)] border-b border-[var(--border-color)] z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Rank</th>
                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Team</th>
                    <th className="py-4 px-6 text-right font-semibold uppercase tracking-wider text-xs">Net Worth</th>
                    <th className="py-4 px-6 text-right font-semibold uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, idx) => (
                    <tr key={team.id} className="table-row-modern hover:bg-zinc-800">
                      <td className="py-3 px-6 text-zinc-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-6 font-bold text-white">{team.name}</td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-white">₹{team.totalValue.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => resetPortfolio(team.id, team.name)} className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="Reset Portfolio">
                             <RefreshCcw size={16} />
                          </button>
                          <button onClick={() => deleteTeam(team.id, team.name)} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete Team">
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                     <tr><td colSpan={4} className="text-center py-8 text-zinc-500">No teams registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* EVENT TRIGGERS */}
          <div className="dashboard-panel flex flex-col h-[50vh]">
            <div className="p-5 border-b border-[var(--border-color)] bg-[var(--panel-bg)] rounded-t-xl">
              <h2 className="text-base font-bold flex items-center gap-2"><Activity size={18} className="text-zinc-400"/> Quick Interventions</h2>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-8 bg-[var(--panel-bg)] rounded-b-xl custom-scrollbar">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Current Phase: {phase}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => changePhase('PORTFOLIO')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: PORTFOLIO</button>
                  <button onClick={() => changePhase('GOOD_EVENTS')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: GOOD EVENTS</button>
                  <button onClick={() => changePhase('REVEAL_GOOD')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: REVEAL GOOD</button>
                  <button onClick={() => changePhase('BAD_EVENTS')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: BAD EVENTS</button>
                  <button onClick={() => changePhase('REVEAL_BAD')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: REVEAL BAD</button>
                  <button onClick={() => changePhase('FINAL_DECISION')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Set: FINAL DECISION</button>
                  <button onClick={() => changePhase('END')} className="py-2 text-xs font-semibold hover:bg-zinc-800 border border-zinc-700 rounded text-zinc-300 col-span-2">Set: END (DASHBOARD)</button>
                </div>
                
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-6 mb-2">Resolutions (Apply Decisions)</h3>
                <div className="space-y-2">
                  <button 
                    disabled={isLoading} 
                    onClick={() => resolvePhase('GOOD')} 
                    className="w-full py-2 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold hover:bg-emerald-800 bg-emerald-900 border border-emerald-700 rounded text-white"
                  >
                    Resolve Good Events
                  </button>
                  <button 
                    disabled={isLoading} 
                    onClick={() => resolvePhase('BAD')} 
                    className="w-full py-2 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold hover:bg-red-800 bg-red-900 border border-red-700 rounded text-white"
                  >
                    Resolve Bad Events
                  </button>
                  <button 
                    disabled={isLoading} 
                    onClick={() => resolvePhase('FINAL')} 
                    className="w-full py-2 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold hover:bg-blue-800 bg-blue-900 border border-blue-700 rounded text-white"
                  >
                    Resolve Final Decision
                  </button>
                </div>
                
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mt-6 mb-2">Danger Zone</h3>
                <div className="space-y-2">
                  <button 
                    disabled={isLoading} 
                    onClick={async () => {
                      if (!confirm('Are you sure you want to reset ALL portfolios and balances to 1,000,000? This cannot be undone.')) return;
                      setIsLoading(true);
                      await fetch('/api/admin/reset', { method: 'POST' });
                      fetchState();
                      setIsLoading(false);
                    }} 
                    className="w-full py-2 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold hover:bg-red-950 bg-black border border-red-900 rounded text-red-500"
                  >
                    Reset All Portfolios & Balances
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ASSET MANAGEMENT */}
        <div className="dashboard-panel flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--panel-bg)] rounded-t-xl">
            <h2 className="text-base font-bold flex items-center gap-2"><Building size={18} className="text-zinc-400"/> Listed Companies & Assets</h2>
            <button onClick={() => openStockForm()} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-sm">
              <Plus size={14} /> Add Company
            </button>
          </div>
          
          {showStockForm && (
            <div className="p-5 border-b border-[var(--border-color)] bg-zinc-900/50">
              <form onSubmit={saveStock} className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1 uppercase">Symbol</label>
                  <input type="text" required value={stockForm.symbol} onChange={e => setStockForm({...stockForm, symbol: e.target.value.toUpperCase()})} className="bg-[var(--background)] border border-[var(--border-color)] rounded p-2 text-sm w-24" placeholder="AAPL" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-zinc-500 block mb-1 uppercase">Company Name</label>
                  <input type="text" required value={stockForm.name} onChange={e => setStockForm({...stockForm, name: e.target.value})} className="bg-[var(--background)] border border-[var(--border-color)] rounded p-2 text-sm w-full" placeholder="Apple Inc." />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1 uppercase">Sector</label>
                  <input type="text" required value={stockForm.sector} onChange={e => setStockForm({...stockForm, sector: e.target.value})} className="bg-[var(--background)] border border-[var(--border-color)] rounded p-2 text-sm w-32" placeholder="Tech" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1 uppercase">Price (₹)</label>
                  <input type="number" required step="0.01" value={stockForm.currentPrice} onChange={e => setStockForm({...stockForm, currentPrice: parseFloat(e.target.value)})} className="bg-[var(--background)] border border-[var(--border-color)] rounded p-2 text-sm w-28" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1 uppercase">Risk</label>
                  <select value={stockForm.riskProfile} onChange={e => setStockForm({...stockForm, riskProfile: e.target.value})} className="bg-[var(--background)] border border-[var(--border-color)] rounded p-2 text-sm max-w-xs">
                    <option value="Low Risk">Low Risk</option>
                    <option value="Medium Risk">Medium Risk</option>
                    <option value="High Risk">High Risk</option>
                    <option value="High Growth / High Risk">High Growth / High Risk</option>
                    <option value="High Growth / Med Risk">High Growth / Med Risk</option>
                    <option value="Stable Growth / Med Risk">Stable Growth / Med Risk</option>
                    <option value="Cash-Flow Steady / Low Risk">Cash-Flow Steady / Low Risk</option>
                    <option value="Defensive / Low Growth">Defensive / Low Growth</option>
                    <option value="Macro-Linked / Med Risk">Macro-Linked / Med Risk</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowStockForm(false)} className="px-4 py-2 rounded text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 rounded text-sm bg-white text-black font-bold">{editingStock ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500 bg-[var(--panel-bg)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Symbol</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Company Name</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs">Sector</th>
                  <th className="py-4 px-6 text-right font-semibold uppercase tracking-wider text-xs">Current Price</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-center">Risk</th>
                  <th className="py-4 px-6 text-right font-semibold uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.id} className="table-row-modern hover:bg-zinc-800">
                    <td className="py-3 px-6 font-bold text-white">{stock.symbol}</td>
                    <td className="py-3 px-6 text-zinc-300">{stock.name}</td>
                    <td className="py-3 px-6 text-zinc-400">{stock.sector}</td>
                    <td className="py-3 px-6 text-right font-mono font-bold text-emerald-400">₹{stock.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="py-3 px-6 text-center">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${stock.riskProfile.toUpperCase().includes('HIGH') ? 'bg-red-500/20 text-red-400' : stock.riskProfile.toUpperCase().includes('MED') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                         {stock.riskProfile}
                       </span>
                    </td>
                    <td className="py-3 px-6 text-right flex justify-end gap-3">
                      <button onClick={() => openStockForm(stock)} className="text-zinc-400 hover:text-white transition-colors" title="Edit Asset">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteStock(stock.id, stock.symbol)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete Asset">
                         <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {stocks.length === 0 && (
                   <tr><td colSpan={6} className="text-center py-8 text-zinc-500">No companies listed.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
