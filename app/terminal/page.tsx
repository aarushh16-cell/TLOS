"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useMemo, useRef } from "react";
import { Activity, Briefcase, Clock, Search, TrendingUp, TrendingDown, RefreshCcw, ShieldAlert, CheckCircle2, LogOut, Loader2, Menu, X, Eye, EyeOff } from "lucide-react";

type Stock = { symbol: string, name: string, currentPrice: number, availableShares: number, sector: string, riskProfile: string };
type Portfolio = { stockSymbol: string, shares: number, currentPrice: number, stock?: Stock };
type Decision = { eventId: number, choice: string };

const goodEvents = [
  { id: 1, target: 'NOVA', title: 'Enterprise AI Expansion', options: [{ id: 'A', label: 'Aggressive', costText: "25% of gain", effect: '+30% Valuation' }, { id: 'B', label: 'Moderate', costText: "25% of gain", effect: '+15% Valuation' }, { id: 'C', label: 'Pass', costText: "Free", effect: 'No Change' }] },
  { id: 2, target: 'VOLT', title: 'National EV Subsidy', options: [{ id: 'A', label: 'Aggressive', costText: "25% of gain", effect: '+22% Valuation' }, { id: 'B', label: 'Moderate', costText: "25% of gain", effect: '+11% Valuation' }, { id: 'C', label: 'Pass', costText: "Free", effect: 'No Change' }] },
  { id: 3, target: 'FINCO', title: 'Banking Rate Cut', options: [{ id: 'A', label: 'Aggressive', costText: "25% of gain", effect: '+18% Valuation' }, { id: 'B', label: 'Moderate', costText: "25% of gain", effect: '+9% Valuation' }, { id: 'C', label: 'Pass', costText: "Free", effect: 'No Change' }] }
];

const badEvents = [
  { id: 4, target: 'NOVA', title: 'Privacy and Regulatory Crackdown', options: [{ id: 'A', label: 'HOLD', costText: "Take Drop", effect: '-10% Valuation' }, { id: 'B', label: 'SELL HALF', costText: "8% Discount", effect: 'Auto-Sell 50% @ Current Price' }, { id: 'C', label: 'EXIT', costText: "8% Discount", effect: 'Auto-Sell All @ Current Price' }] },
  { id: 5, target: 'SHIPX', title: 'Supply Chain and Tariff Spike', options: [{ id: 'A', label: 'HOLD', costText: "Take Drop", effect: '-6% Valuation' }, { id: 'B', label: 'SELL HALF', costText: "8% Discount", effect: 'Auto-Sell 50% @ Current Price' }, { id: 'C', label: 'EXIT', costText: "8% Discount", effect: 'Auto-Sell All @ Current Price' }] },
  { id: 6, target: 'FRESH', title: 'Raw Material and Price Caps', options: [{ id: 'A', label: 'HOLD', costText: "Take Drop", effect: '-4% Valuation' }, { id: 'B', label: 'SELL HALF', costText: "8% Discount", effect: 'Auto-Sell 50% @ Current Price' }, { id: 'C', label: 'EXIT', costText: "8% Discount", effect: 'Auto-Sell All @ Current Price' }] }
];

const finalEvent = { id: 7, target: 'ALL', title: 'Deploy Remaining Cash Balance', options: [{ id: 'PATH_1', label: 'Safe Asset', cost: 0, effect: '+5% Yield' }, { id: 'PATH_2', label: 'Balanced Fund', cost: 0, effect: '+12% Yield' }, { id: 'PATH_3', label: 'Aggressive Growth Play', cost: 0, effect: '+25% Yield' }] };

export default function TerminalPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [phase, setPhase] = useState<string>("PORTFOLIO");
  
  const [activeStockSymbol, setActiveStockSymbol] = useState<string | null>(null);
  
  const activeStock = useMemo(() => {
    return stocks.find(s => s.symbol === activeStockSymbol) || stocks[0] || null;
  }, [stocks, activeStockSymbol]);
  
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);
  const [isTradingEnabled, setIsTradingEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOutcomes, setShowOutcomes] = useState(false);

  const fetchState = () => {
    fetch('/api/team/state', { cache: 'no-store' }).then(res => res.json()).then(data => {
      setBalance(data.balance || 0);
      setPortfolio(data.portfolio || []);
      setStocks(data.stocks || []);
      setDecisions(data.decisions || []);
      setPhase(data.phase || "PORTFOLIO");
      setIsTradingEnabled(data.isTradingEnabled ?? true);
    });
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = async () => {
     const qty = parseInt(quantity);
     if (!activeStock || !qty || qty <= 0) return;
     setIsTrading(true);
     
     const res = await fetch('/api/trade', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ stockSymbol: activeStock.symbol, shares: qty, type: orderType })
     });
     
     const result = await res.json();
     if (result.success) {
       setQuantity("");
       fetchState();
     } else {
       alert(result.error);
     }
     setIsTrading(false);
  };

  const submitDecision = async (eventId: number, choice: string) => {
    setIsTrading(true);
    const res = await fetch('/api/team/decide', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ eventId, choice })
    });
    const result = await res.json();
    if (!result.success) {
      alert(result.error);
    }
    fetchState();
    setIsTrading(false);
  }

  const [chartData, setChartData] = useState<{open: number, close: number, high: number, low: number}[]>([]);
  const lastPriceRef = useRef<number>(100);
  const currentPriceRef = useRef<number>(100);

  useEffect(() => {
    if (activeStock) {
      currentPriceRef.current = activeStock.currentPrice;
    }
  }, [activeStock?.currentPrice]);

  useEffect(() => {
    if (!activeStockSymbol) return;
    
    let tempPrice = currentPriceRef.current;
    lastPriceRef.current = tempPrice;
    const initial = Array.from({length: 40}).map(() => {
      const isUp = Math.random() > 0.5;
      const change = Math.random() * 0.5;
      const open = tempPrice;
      const close = isUp ? open + change : open - change;
      const high = Math.max(open, close) + Math.random() * 0.5;
      const low = Math.min(open, close) - Math.random() * 0.5;
      tempPrice = close;
      return { open, close, high, low };
    });
    setChartData(initial);
  }, [activeStockSymbol]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        
        const currentRealPrice = currentPriceRef.current;
        const lastRealPrice = lastPriceRef.current;
        
        const lastCandle = prev[prev.length - 1];
        const open = lastCandle.close;
        let close = open;
        
        if (currentRealPrice !== lastRealPrice) {
           close = currentRealPrice;
           lastPriceRef.current = currentRealPrice;
        } else {
           const drift = currentRealPrice - open; 
           const noise = (Math.random() - 0.5) * 0.4;
           close = open + noise + (drift * 0.2); 
        }
        
        const high = Math.max(open, close) + Math.random() * 0.2;
        const low = Math.min(open, close) - Math.random() * 0.2;
        
        const newHistory = [...prev.slice(1)];
        newHistory.push({ open, close, high, low });
        
        return newHistory;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  if (!session || !session.user || (session.user as any).role !== 'TEAM') {
     return <div className="p-8 text-red-500 font-mono flex items-center justify-center h-screen bg-[var(--background)]">401 Unauthorized</div>;
  }

  const getPortfolioPrice = (p: Portfolio) => phase === 'PORTFOLIO' ? (p.stock?.currentPrice || 0) : p.currentPrice;
  const totalValue = balance + portfolio.reduce((acc, p) => acc + (p.shares * getPortfolioPrice(p)), 0);
  const parsedQty = parseInt(quantity) || 0;
  const estimatedCost = (activeStock?.currentPrice || 0) * parsedQty;

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(c => c.low)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(c => c.high)) : 100;
  const priceRange = maxPrice - minPrice || 1;
  const pad = priceRange * 0.1;
  const renderMin = minPrice - pad;
  const renderMax = maxPrice + pad;
  const renderRange = renderMax - renderMin;
  const getPercent = (price: number) => ((price - renderMin) / renderRange) * 100;

  // Determine active event
  const isGoodEvents = phase.startsWith('GOOD_EVENTS');
  const isBadEvents = phase.startsWith('BAD_EVENTS');
  const isFinalDecision = phase.startsWith('FINAL_DECISION');
  
  let activeGameEvent = null;
  if (isGoodEvents) activeGameEvent = goodEvents.find(e => !decisions.some(d => d.eventId === e.id));
  if (isBadEvents) activeGameEvent = badEvents.find(e => !decisions.some(d => d.eventId === e.id));
  if (isFinalDecision) activeGameEvent = !decisions.some(d => d.eventId === 7) ? finalEvent : null;

  const isDecisionPhase = isGoodEvents || isBadEvents || isFinalDecision;
  const optionsRevealed = phase.endsWith('_REVEALED');

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans relative">
      
      {phase === 'END' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
           <div className="bg-zinc-900 border border-zinc-700 p-10 rounded-2xl max-w-4xl w-full text-center shadow-2xl">
              <h1 className="text-5xl font-black text-white mb-2 tracking-tight">Market Closed</h1>
              <p className="text-zinc-400 mb-10 text-lg">Final Valuations</p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                 <div className="bg-black/50 p-6 rounded-xl border border-zinc-800">
                    <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">Final Liquid Cash</p>
                    <p className="text-4xl font-mono text-white">₹{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
                 <div className="bg-black/50 p-6 rounded-xl border border-zinc-800">
                    <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">Total Portfolio Value</p>
                    <p className="text-4xl font-mono text-emerald-400">₹{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
              </div>

              <div className="text-left">
                <h3 className="text-sm font-bold text-zinc-500 uppercase mb-4">Stock Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {stocks.map(s => {
                    const held = portfolio.find(p => p.stockSymbol === s.symbol)?.shares || 0;
                    return (
                      <div key={s.symbol} className="bg-black/50 p-4 rounded-lg border border-zinc-800">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white">{s.symbol}</span>
                           <span className="font-mono text-sm text-zinc-400">₹{(portfolio.find(p => p.stockSymbol === s.symbol)?.currentPrice || s.currentPrice).toFixed(2)}</span>
                         </div>
                         <p className="text-xs text-zinc-500">Held: {held.toLocaleString()} shares</p>
                         <p className="text-xs font-mono font-bold text-emerald-500 mt-1">Value: ₹{(held * (portfolio.find(p => p.stockSymbol === s.symbol)?.currentPrice || s.currentPrice)).toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* HEADER */}
      <header className="h-16 border-b border-[var(--border-color)] bg-[var(--panel-bg)] flex justify-between items-center px-4 sm:px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--foreground)] rounded-lg flex items-center justify-center font-black text-[var(--background)] shadow-sm">T</div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="font-bold tracking-tight leading-tight text-sm sm:text-base">TLOS Markets</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-sm">
                {session?.user?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
              <p className="text-[10px] sm:text-[11px] text-zinc-500 font-mono uppercase truncate">Phase: <span className="font-semibold text-[var(--foreground)]">{phase.replace('_', ' ')}</span></p>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1" title="Log Out">
                <LogOut size={12} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-12">
           <div className="hidden lg:flex flex-col items-end">
             <span className="text-[11px] text-zinc-500 uppercase font-semibold">Cash Reserve</span>
             <span className="font-mono font-medium text-emerald-400">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[10px] sm:text-[11px] text-zinc-500 uppercase font-semibold">Total Net Worth</span>
             <span className="font-mono text-sm sm:text-base font-medium text-white">{isDecisionPhase ? '---' : `₹${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
           </div>
           <div className="hidden lg:flex flex-col items-end">
             <span className="text-[11px] text-zinc-500 uppercase font-semibold">Net Returns (P&L)</span>
             <span className={`font-mono font-medium ${isDecisionPhase ? 'text-zinc-500' : totalValue - 1000000 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
               {isDecisionPhase ? '---' : `${totalValue - 1000000 >= 0 ? '+' : '-'}₹${Math.abs(totalValue - 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
             </span>
           </div>
           
           <button 
             className="lg:hidden p-1.5 sm:p-2 text-zinc-400 hover:text-white"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           >
             {mobileMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
           </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
        
        {/* LEFT SIDEBAR: MARKETS */}
        <div className={`${mobileMenuOpen ? 'flex absolute inset-0 z-40' : 'hidden'} lg:flex lg:relative w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--panel-bg)] flex-col shrink-0 h-full`}>
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold">Markets</h2>
              {mobileMenuOpen && (
                <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-zinc-400 p-1">
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {stocks.map(stock => (
                <div 
                  key={stock.symbol} 
                  onClick={() => setActiveStockSymbol(stock.symbol)}
                  className={`px-4 py-3 border-b border-[var(--border-color)] cursor-pointer flex justify-between items-center transition-colors ${activeStock?.symbol === stock.symbol ? 'bg-zinc-200 dark:bg-zinc-800 border-l-4 border-l-emerald-500' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border-l-4 border-l-transparent'}`}
                >
                  <div>
                     <p className="font-semibold text-sm text-[var(--foreground)]">{stock.symbol}</p>
                     <p className="text-[11px] text-zinc-500">{stock.name}</p>
                  </div>
                  <div className="text-right">
                     <p className="font-mono text-sm text-[var(--foreground)] font-medium">₹{stock.currentPrice.toFixed(2)}</p>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* CENTER: CHART & PORTFOLIO */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)] shrink-0 h-auto lg:h-full">
          
          {/* CHART AREA */}
          <div className="h-[400px] lg:h-auto lg:flex-[3] flex flex-col border-b border-[var(--border-color)] relative shrink-0">
             <div className="px-6 py-4 flex justify-between items-end relative z-10">
               <div>
                 <h2 className="text-2xl font-bold tracking-tight">{activeStock?.symbol}</h2>
                 <p className="text-sm text-zinc-500 mb-1">{activeStock?.name} &bull; {activeStock?.sector}</p>
                 <div className="flex gap-2">
                   <span className="inline-block px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded border border-zinc-700">
                      Risk: {activeStock?.riskProfile || 'Unknown'}
                   </span>
                   <span className="inline-block px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded border border-zinc-700">
                      Available: {activeStock?.availableShares?.toLocaleString() || 0}
                   </span>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-3xl font-mono font-bold tracking-tight text-white">₹{activeStock?.currentPrice.toFixed(2)}</p>
               </div>
             </div>
             
             <div className="flex-1 relative flex items-end justify-between px-6 pb-6 pt-10 z-10">
               <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-6 z-0">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className="w-full border-t border-zinc-800/30"></div>
                 ))}
               </div>
               
               <div className="flex-1 flex justify-between h-full relative z-10 w-full pr-12">
                 {chartData.map((candle, i) => {
                   const isUp = candle.close >= candle.open;
                   const topBody = getPercent(Math.max(candle.open, candle.close));
                   const bottomBody = getPercent(Math.min(candle.open, candle.close));
                   const bodyHeight = Math.max(0.5, topBody - bottomBody);
                   
                   const topWick = getPercent(candle.high);
                   const bottomWick = getPercent(candle.low);
                   const wickHeight = topWick - bottomWick;

                   return (
                     <div key={i} className="relative flex flex-col items-center justify-end w-full group h-full">
                       <div className={`w-[1px] absolute ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ height: `${wickHeight}%`, bottom: `${bottomWick}%` }}></div>
                       <div className={`w-full max-w-[8px] z-10 rounded-[1px] ${isUp ? 'bg-emerald-500' : 'bg-red-500'} transition-all`} style={{ height: `${bodyHeight}%`, bottom: `${bottomBody}%`, position: 'absolute' }}></div>
                     </div>
                   );
                 })}
               </div>
               
               <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[10px] text-zinc-500 font-mono py-6 text-right pr-2 bg-[var(--background)]/50 z-20">
                 <span>{renderMax.toFixed(2)}</span>
                 <span>{(renderMax - renderRange * 0.25).toFixed(2)}</span>
                 <span>{(renderMax - renderRange * 0.5).toFixed(2)}</span>
                 <span>{(renderMax - renderRange * 0.75).toFixed(2)}</span>
                 <span>{renderMin.toFixed(2)}</span>
               </div>
               
               <div className="absolute inset-0 border-b border-[var(--border-color)] pointer-events-none z-0" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.01), transparent)' }}></div>
             </div>
          </div>

          {/* PORTFOLIO AREA */}
          <div className="h-[350px] lg:h-auto lg:flex-[2] flex flex-col bg-[var(--panel-bg)] shrink-0">
            <div className="px-6 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Briefcase size={16} className="text-zinc-400" /> Holdings
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500 sticky top-0 bg-[var(--panel-bg)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-3 px-6 font-medium">Asset</th>
                    <th className="py-3 px-6 text-right font-medium">Shares</th>
                    <th className="py-3 px-6 text-right font-medium">Current Price</th>
                    <th className="py-3 px-6 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map(p => {
                    const priceToUse = phase === 'PORTFOLIO' ? (p.stock?.currentPrice || 0) : p.currentPrice;
                    const val = p.shares * priceToUse;
                    return (
                    <tr key={p.stockSymbol} className="table-row-modern hover:bg-zinc-800">
                      <td className="py-3 px-6 font-semibold">{p.stockSymbol}</td>
                      <td className="py-3 px-6 text-right font-mono text-zinc-400">{p.shares.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right font-mono text-zinc-400">₹{priceToUse.toFixed(2)}</td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-white">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  )})}
                  {portfolio.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-zinc-500 text-sm">No positions open in portfolio.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: ORDER EXECUTION OR EVENT SELECTION */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col shrink-0 lg:h-full">
          
          {phase === 'PORTFOLIO' && (
            <div className="p-6 flex flex-col h-full">
              <h2 className="text-sm font-semibold mb-6 text-zinc-300 flex items-center gap-2"><Activity size={16}/> Initial Buy Phase</h2>
              
              <div className="flex rounded-md bg-[var(--background)] p-1 border border-[var(--border-color)] mb-6">
                <button 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${orderType === 'BUY' ? 'bg-[var(--foreground)] text-[var(--background)] shadow' : 'text-zinc-500 hover:text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  onClick={() => setOrderType('BUY')}
                >
                  Buy
                </button>
                <button 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${orderType === 'SELL' ? 'bg-[var(--foreground)] text-[var(--background)] shadow' : 'text-zinc-500 hover:text-[var(--foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  onClick={() => setOrderType('SELL')}
                >
                  Sell
                </button>
              </div>

              <div className="space-y-5 flex-1">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block font-medium uppercase tracking-wider">Symbol</label>
                  <div className="bg-[var(--background)] border border-[var(--border-color)] p-3 text-lg font-bold rounded-md flex items-center justify-between text-white">
                    <span>{activeStock?.symbol || '---'}</span>
                    <span className="text-sm text-zinc-400 font-mono">₹{activeStock?.currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block font-medium uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border-color)] p-3 text-lg font-mono rounded-md focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-white"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] mt-6">
                   <div className="flex justify-between text-sm mb-2 text-zinc-300">
                     <span className="text-zinc-500 font-medium">Order Type</span>
                     <span className="font-semibold">Market</span>
                   </div>
                   <div className="flex justify-between text-sm mt-4">
                     <span className="text-zinc-500 font-medium">Estimated Value</span>
                     <span className="font-mono font-bold text-lg text-white">
                       ₹{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>
                </div>
              </div>

              <button 
                onClick={handleTrade}
                disabled={isTrading || parsedQty <= 0 || !isTradingEnabled}
                className={`w-full py-4 text-white font-bold tracking-wide rounded-lg transition-all mt-4 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${!isTradingEnabled ? 'bg-zinc-700 opacity-50 cursor-not-allowed' : orderType === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
              >
                {!isTradingEnabled ? 'Market Frozen' : isTrading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `${orderType === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}`}
              </button>
            </div>
          )}

          {isDecisionPhase && activeGameEvent && (
             <div className="p-6 flex flex-col h-full bg-blue-900/10">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="text-blue-400" size={20} />
                  <h2 className="text-sm font-bold text-blue-100 uppercase tracking-widest">Action Required</h2>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white mb-2 leading-tight">{activeGameEvent.title}</h3>
                  {activeGameEvent.target !== 'ALL' && (
                    <p className="text-sm font-medium text-zinc-400 mb-6 bg-zinc-800/50 inline-block px-3 py-1 rounded-full border border-zinc-700">Target Asset: <span className="text-white font-bold">{activeGameEvent.target}</span></p>
                  )}
                  
                  {!optionsRevealed ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-black/30 border border-zinc-800 rounded-xl mt-8">
                      <Clock className="w-12 h-12 text-zinc-500 mb-4 animate-pulse" />
                      <h4 className="text-lg font-bold text-white mb-2">Awaiting Options</h4>
                      <p className="text-sm text-zinc-400 text-center">The admin will reveal the available options shortly. Prepare your strategy.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-300 mb-4">Select your strategic response carefully. Your cash reserves will be deducted immediately, but market outcomes remain hidden until the phase ends.</p>
                      
                      <div className="flex justify-end mb-4">
                        <button 
                          onClick={() => setShowOutcomes(!showOutcomes)} 
                          className="text-xs bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {showOutcomes ? <EyeOff size={14} /> : <Eye size={14} />}
                          {showOutcomes ? 'Hide Potential Outcomes' : 'Reveal Potential Outcomes'}
                        </button>
                      </div>

                  <div className="space-y-4">
                     {activeGameEvent.options.map((opt: any) => (
                      <button 
                        key={opt.id}
                        onClick={() => submitDecision(activeGameEvent.id, opt.id)}
                        disabled={isTrading}
                        className={`w-full text-left p-4 rounded-xl border transition-all bg-zinc-800 border-zinc-700 hover:border-blue-500 hover:bg-zinc-800/80 shadow-sm`}
                      >
                         <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-white text-lg">{opt.label}</span>
                           <span className="text-xs font-bold bg-zinc-900 px-2 py-1 rounded text-zinc-400">
                             {opt.id}
                           </span>
                         </div>
                         <div className="font-mono text-sm text-zinc-400 mt-2 flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span>Cost:</span>
                              <span className="text-white font-bold">{opt.costText || "Free"}</span>
                            </div>
                            {showOutcomes && (
                              <div className="flex justify-between border-t border-zinc-700/50 pt-2 mt-1">
                                <span>Outcome:</span>
                                <span className="text-emerald-400 font-bold">{opt.effect}</span>
                              </div>
                            )}
                         </div>
                      </button>
                    ))}
                  </div>
                  </>
                  )}
                </div>
             </div>
          )}

          {isDecisionPhase && !activeGameEvent && (
             <div className="p-6 flex flex-col items-center justify-center h-full text-center">
                <CheckCircle2 className="text-emerald-500 w-16 h-16 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Decisions Locked</h2>
                <p className="text-zinc-400 text-sm">You have completed all actions for this phase. Awaiting admin resolution to reveal market outcomes.</p>
             </div>
          )}

          {(phase === 'REVEAL_GOOD' || phase === 'REVEAL_BAD') && (
             <div className="p-6 flex flex-col items-center justify-center h-full text-center bg-zinc-900/50">
                <Activity className="text-emerald-500 w-12 h-12 mb-4 animate-pulse" />
                <h2 className="text-xl font-bold text-white mb-2">Market Updated</h2>
                <p className="text-zinc-400 text-sm">The outcomes of the recent events have been processed. Review your updated Portfolio Value on the dashboard.</p>
             </div>
          )}

        </div>

      </div>
    </div>
  );
}
