"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Target, Activity, AlertTriangle, Trophy, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function RulesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const faqs = [
    { q: "Can we trade stocks after Phase 1?", a: "No. All purchasing happens strictly in Phase 1. Subsequent phases only allow you to hold, liquidate, or hedge based on event choices." },
    { q: "What happens if we don't have enough cash for an event choice?", a: "The terminal will disable options you cannot afford. You will be forced to pick a cheaper alternative or 'Pass/Hold'." },
    { q: "Is the simulation live?", a: "Yes, the admin progresses the phases in real-time, and your team must submit decisions before the timer expires." },
    { q: "Can we collaborate with other teams?", a: "Collusion is forbidden. Each team must operate its own independent portfolio." }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-y-auto selection:bg-emerald-500/30">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-emerald-500 w-6 h-6" />
          <h1 className="text-xl font-black tracking-tight">TLOS: THE MARKET - OFFICIAL RULES</h1>
        </div>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>

      <main className="max-w-4xl mx-auto py-16 px-6">
        
        <section className="mb-16">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3"><Target className="text-blue-500"/> 1. Game Setup</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4">
            <p className="text-lg text-zinc-300">
              <strong className="text-white">Starting Capital:</strong> Every team begins with exactly <span className="font-mono text-emerald-400 font-bold">₹10,00,000</span> (10 Lakhs) in liquid cash.
            </p>
            <p className="text-lg text-zinc-300">
              <strong className="text-white">Initial Stock Pool:</strong> There are 6 fictional companies in the market: 
              <span className="font-bold text-white ml-2">NOVA (Tech), VOLT (EV), MEDIX (Health), FINCO (Bank), FRESH (FMCG), SHIPX (Logistics)</span>.
            </p>
            <p className="text-lg text-zinc-300">
              <strong className="text-white">Base Valuation:</strong> All companies start at exactly <span className="font-mono font-bold text-white">₹100/share</span>.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3"><Activity className="text-emerald-500"/> 2. The 4 Phases of Play</h2>
          
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-2">Phase 1: Initial Portfolio Building</h3>
              <p className="text-zinc-400 leading-relaxed">
                Teams log into their trading terminal and purchase their initial allocations across the 6 stocks. Your total purchases cannot exceed ₹10,00,000. Any remaining amount stays as your "Cash Reserve". Choose wisely, as no mid-game trading is allowed after this phase!
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-2">Phase 2: Growth Opportunities (Good Events)</h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The market presents 3 positive scenarios. For each event, teams must pick one strategic response:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                <li><strong className="text-emerald-400">Aggressive:</strong> High cash cost, highest potential stock multiplier.</li>
                <li><strong className="text-blue-400">Moderate:</strong> Medium cash cost, moderate multiplier.</li>
                <li><strong className="text-zinc-400">Pass:</strong> Zero cost, zero multiplier (status quo).</li>
              </ul>
              <p className="mt-4 text-sm text-zinc-500 italic">Note: Market outcomes are hidden until all events in the phase are completed.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle className="text-red-500 w-5 h-5"/> Phase 3: Market Shocks (Bad Events)</h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The market takes a downturn with 3 crisis scenarios. Choose how to protect your portfolio:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-zinc-300">
                <li><strong className="text-red-400">Hold:</strong> Take the hit. The stock price drops and your portfolio value shrinks. Zero cash cost.</li>
                <li><strong className="text-yellow-400">Exit (Liquidate):</strong> Sell all your shares of that company instantly at the current price to save your cash.</li>
                <li><strong className="text-emerald-400">Double Down / Hedge:</strong> Pay a high cash cost to turn the crisis into an opportunity, forcing the stock to rebound into the green!</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-2">Phase 4: Final Cash Deployment</h3>
              <p className="text-zinc-400 leading-relaxed">
                If you saved any liquid cash through the tumultuous market, you have one final choice: deploy it in a Safe (+5%), Balanced (+12%), or Aggressive (+25%) yield strategy.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3"><Trophy className="text-yellow-500"/> 3. Winning the Game</h2>
          <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-900 border border-yellow-500/30 rounded-xl p-8">
            <p className="text-lg text-zinc-300 mb-6">
              The team with the highest <strong className="text-white">Final Total Portfolio Value</strong> wins the crown.
            </p>
            <div className="bg-black/50 p-6 rounded-lg font-mono text-sm text-zinc-400 border border-zinc-800">
              <p>Holding Value = Remaining Shares Held × Final Share Price</p>
              <p className="my-2 border-b border-zinc-800 pb-2">Total Portfolio Value = Final Cash Balance + Sum of all Holding Values</p>
              <p className="text-emerald-400 font-bold">ROI % = ((Total Portfolio Value - ₹10,00,000) / ₹10,00,000) × 100</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3"><HelpCircle className="text-purple-500"/> 4. Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <span className="font-bold text-white text-lg">{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 pt-2 border-t border-zinc-800/50 text-zinc-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="text-center mb-8 text-zinc-500 text-sm">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div className="text-center mt-8 pb-12">
          <Link href="/login" className="inline-block px-12 py-4 bg-white text-black font-black text-lg tracking-widest uppercase rounded-full hover:bg-emerald-400 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20">
            Enter the Market
          </Link>
        </div>
      </main>
    </div>
  )
}
