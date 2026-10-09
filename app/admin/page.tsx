"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Users, Activity, ShieldAlert, BarChart3, Settings2, Power, Building, Trash2, Edit2, Plus, RefreshCcw, Trophy } from "lucide-react";

type LeaderboardTeam = {
  id: string, name: string, balance: number, portfolioValue: number, totalValue: number, userId: string,
  portfolio: any[], transactions: any[], decisions: any[]
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

  // Inspector & Evaluator
  const [inspectingTeam, setInspectingTeam] = useState<LeaderboardTeam | null>(null);
  const [judgeBonus, setJudgeBonus] = useState<number>(0);
  const [evaluations, setEvaluations] = useState<any[] | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  const requestConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

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
    requestConfirm(`Change phase to ${newPhase}?`, async () => {
      const res = await fetch('/api/admin/phase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase: newPhase }) });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Failed to change phase');
      fetchState();
    });
  };

  const toggleTrading = async () => {
    const newState = !isTradingEnabled;
    requestConfirm(`Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} market trading?`, async () => {
      const res = await fetch('/api/admin/trading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isTradingEnabled: newState }) });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Failed to toggle trading');
      fetchState();
    });
  };

  const resolvePhase = async (type: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('Server returned an invalid response (500 Error)');
      }
      
      if (data.success) {
        alert(`Success! Processed ${data.processedDecisions} team decisions for ${type} phase.`);
      } else {
        alert(`Error processing resolutions: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      fetchState();
    }
  };
  
  const deleteTeam = async (teamId: string, teamName: string) => {
    requestConfirm(`Are you sure you want to permanently delete team "${teamName}"?`, async () => {
      setIsLoading(true);
      const res = await fetch('/api/admin/team', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId }) });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Failed to delete team');
      fetchState();
      setIsLoading(false);
    });
  };
  
  const resetPortfolio = async (teamId: string, teamName: string) => {
    requestConfirm(`Reset portfolio for ${teamName === 'ALL' ? 'ALL TEAMS' : `"${teamName}"`}? This will refund their 1M balance and return their shares to the global supply.`, async () => {
      setIsLoading(true);
      const res = await fetch('/api/admin/reset-portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId }) });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Failed to reset portfolio');
      fetchState();
      setIsLoading(false);
    });
  };
  
  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const body = editingStock ? { id: editingStock.id, ...stockForm } : stockForm;
    const res = await fetch('/api/admin/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok || !data.success) alert(data.error || 'Failed to save stock');
    setShowStockForm(false);
    setEditingStock(null);
    fetchState();
    setIsLoading(false);
  };
  
  const deleteStock = async (id: string, symbol: string) => {
    requestConfirm(`Delete stock ${symbol}?`, async () => {
      setIsLoading(true);
      const res = await fetch('/api/admin/stock', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Failed to delete stock');
      fetchState();
      setIsLoading(false);
    });
  }

  const saveJudgeBonus = async (teamId: string) => {
    setIsLoading(true);
    const res = await fetch('/api/admin/judge-bonus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId, bonus: judgeBonus }) });
    const data = await res.json();
    if (!res.ok || !data.success) alert(data.error || 'Failed to save Judge Bonus');
    else alert('Judge Bonus saved!');
    fetchState();
    setIsLoading(false);
  }

  const evaluateFinalScores = async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/evaluate');
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to evaluate');
    } else {
      setEvaluations(data.evaluations);
    }
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
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Action</h3>
            <p className="text-zinc-300 mb-8">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-bold transition-colors shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <button onClick={() => setInspectingTeam(team)} className="text-emerald-400 hover:text-emerald-300 transition-colors p-1" title="Inspect Team">
                             <Activity size={16} />
                          </button>
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
                  <button 
                    disabled={isLoading} 
                    onClick={evaluateFinalScores} 
                    className="w-full py-2 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold hover:bg-purple-800 bg-purple-900 border border-purple-700 rounded text-white mt-4"
                  >
                    Evaluate Final 100-pt Score
                  </button>
                </div>
                
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mt-6 mb-2">Danger Zone</h3>
                <div className="space-y-2">
                  <button 
                    disabled={isLoading} 
                    onClick={() => {
                      requestConfirm('Are you sure you want to reset ALL portfolios and balances to 1,000,000? This cannot be undone.', async () => {
                        setIsLoading(true);
                        await fetch('/api/admin/reset', { method: 'POST' });
                        fetchState();
                        setIsLoading(false);
                      });
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

      {/* Team Inspector Modal */}
      {inspectingTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Activity /> Inspect Team: {inspectingTeam.name}</h3>
              <button onClick={() => setInspectingTeam(null)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-zinc-400 text-sm font-bold uppercase mb-1">Liquid Cash</p>
                <p className="text-2xl font-mono text-emerald-400">₹{inspectingTeam.balance.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-zinc-400 text-sm font-bold uppercase mb-1">Portfolio Value</p>
                <p className="text-2xl font-mono text-blue-400">₹{inspectingTeam.portfolioValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-white mb-3">Portfolio Details</h4>
              <table className="w-full text-sm text-left">
                <thead className="text-zinc-500 border-b border-zinc-700">
                  <tr><th>Asset</th><th>Shares</th><th>Valuation</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {inspectingTeam.portfolio?.map((p, i) => (
                    <tr key={i} className="border-b border-zinc-800">
                      <td className="py-2 text-white">{p.stockSymbol}</td>
                      <td className="py-2 text-zinc-300 font-mono">{p.shares}</td>
                      <td className="py-2 text-emerald-400 font-mono">₹{(p.currentPrice || 0).toLocaleString()}</td>
                      <td className="py-2 text-blue-400 font-mono">₹{(p.shares * (p.currentPrice || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-400">Judge Bonus (0-3 Points)</h4>
                <p className="text-xs text-purple-300/70">Awarded for analysis, presentation, and teamwork.</p>
              </div>
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  min="0" max="3" 
                  value={judgeBonus} 
                  onChange={e => setJudgeBonus(parseInt(e.target.value) || 0)}
                  className="bg-zinc-900 border border-purple-500/50 rounded px-3 py-1 w-20 text-white outline-none focus:border-purple-400"
                />
                <button onClick={() => saveJudgeBonus(inspectingTeam.id)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1 rounded transition">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Leaderboard Modal */}
      {evaluations && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/50 rounded-t-2xl">
              <h3 className="text-3xl font-black text-white flex items-center gap-3">Final 100-Point Evaluation</h3>
              <button onClick={() => setEvaluations(null)} className="text-zinc-500 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-400 border-b border-zinc-700 sticky top-0 bg-zinc-900">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Rank</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Team</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Net Worth (Tiebreaker)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center text-emerald-400" title="Max 50">Financial (50)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center text-blue-400" title="Max 30">Decision (30)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center text-red-400" title="Max 20">Risk (20)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-center text-purple-400" title="Max 3">Bonus (3)</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right text-yellow-400">Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((team, idx) => (
                    <tr key={team.id} className="border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors">
                      <td className="py-4 px-4 text-zinc-300 font-bold text-lg">{idx + 1}</td>
                      <td className="py-4 px-4 font-bold text-white text-lg">{team.name}</td>
                      <td className="py-4 px-4 text-right font-mono text-zinc-400">₹{team.netWorth.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400 text-lg">{team.financialReturnScore}</td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-blue-400 text-lg">{team.decisionPoints}</td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-red-400 text-lg">{team.riskPoints}</td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-purple-400 text-lg">+{team.judgeBonus}</td>
                      <td className="py-4 px-4 text-right font-mono font-black text-yellow-400 text-2xl">{team.finalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
