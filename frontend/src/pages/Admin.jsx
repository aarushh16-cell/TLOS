import React from 'react';
import TradingFloor3D from '../components/TradingFloor3D';

export default function Admin() {
  const leaderboard = [
    { name: 'TEAM 4', liquid: 1500000, netWorth: 2400000, trend: '+12.4%' },
    { name: 'TEAM 12', liquid: 800000, netWorth: 1900000, trend: '+5.2%' },
    { name: 'TEAM 1', liquid: 200000, netWorth: 1500000, trend: '-2.1%' },
    { name: 'TEAM 28', liquid: 100000, netWorth: 1100000, trend: '-8.4%' },
  ];

  return (
    <div className="app-container" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <div className="scanlines" />
      <TradingFloor3D />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 className="glitch-text" style={{ color: '#ff4444' }}>MISSION CONTROL</h1>
            <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>SYS.OP: ADMIN // PHASE: PORTFOLIO ALLOCATION</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="hero-cta" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', border: 'none', background: '#00ffff', color: '#000' }}>PHASE 1: LIVE</button>
             <button className="hero-cta" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px dashed var(--color-accent)', color: 'var(--color-accent)' }}>PHASE 2: STNDBY</button>
             <button className="hero-cta" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px dashed var(--color-accent)', color: 'var(--color-accent)' }}>PHASE 3: STNDBY</button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
          {/* Leaderboard */}
          <div className="cyber-panel" style={{ flex: 2, overflowY: 'auto', padding: '2rem' }}>
            <div className="hud-brackets" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ color: '#00ffff' }}>GLOBAL LEADERBOARD</h2>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#00ff00', fontSize: '0.8rem' }}>● LIVE SYNC</span>
            </div>
            
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem 0' }}>RANK</th>
                  <th>TEAM NAME</th>
                  <th>LIQUID CASH</th>
                  <th>NET WORTH</th>
                  <th>TREND</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, idx) => (
                  <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'crosshair' }}>
                    <td style={{ padding: '1rem 0', color: 'var(--color-accent)', fontWeight: 'bold' }}>0{idx + 1}</td>
                    <td style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{team.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{team.liquid.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#00ffff' }}>₹{team.netWorth.toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: team.trend.startsWith('+') ? '#00ff00' : '#ff4444' }}>{team.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Event Triggers */}
          <div className="cyber-panel" style={{ flex: 1, overflowY: 'auto', padding: '2rem', border: '1px solid #ff4444', boxShadow: '0 0 20px rgba(255, 0, 0, 0.2)' }}>
            <div className="hud-brackets" style={{ borderColor: '#ff4444' }} />
            <h2 className="glitch-text" style={{ marginBottom: '2rem', color: '#ff4444' }}>EVENT INJECTION</h2>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#00ff00' }}></div>
                <h3 style={{ fontSize: '1rem', color: '#00ff00', fontFamily: 'var(--font-mono)', margin: 0 }}>GROWTH SHOCKS</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="hero-cta" style={{ background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', color: '#00ff00', width: '100%', textAlign: 'left' }}>[EXEC] 1. NOVA AI Expansion</button>
                <button className="hero-cta" style={{ background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', color: '#00ff00', width: '100%', textAlign: 'left' }}>[EXEC] 2. VOLT Subsidy</button>
                <button className="hero-cta" style={{ background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', color: '#00ff00', width: '100%', textAlign: 'left' }}>[EXEC] 3. FINCO Enterprise Win</button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#ff4444' }}></div>
                <h3 style={{ fontSize: '1rem', color: '#ff4444', fontFamily: 'var(--font-mono)', margin: 0 }}>MARKET CRASHES</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="hero-cta hazard-btn" style={{ width: '100%', textAlign: 'left' }}>[WARN] 4. NOVA Privacy Leak</button>
                <button className="hero-cta hazard-btn" style={{ width: '100%', textAlign: 'left' }}>[WARN] 5. SHIPX Fuel Crisis</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
