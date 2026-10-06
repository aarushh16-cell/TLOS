import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TradingFloor3D from '../components/TradingFloor3D';

export default function Login() {
  const [team, setTeam] = useState('1');
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const sequence = [
      "ESTABLISHING SECURE UPLINK...",
      "VERIFYING ENCRYPTION KEYS...",
      "CONNECTING TO TLOS MARKET ENGINE...",
      "AWAITING TEAM AUTHORIZATION..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, sequence[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container" style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <div className="scanlines" />
      <TradingFloor3D />
      <div className="data-stream">
        01010111 01000101 01001100 01000011 01001111 01001101 01000101
        SYS.OP.NORMAL // ENCRYPTED // TLOS-ENGINE
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '600px', padding: '2rem' }}>
        <div className="cyber-panel">
          <div className="hud-brackets" />
          <h1 className="glitch-text" style={{ marginBottom: '0.5rem', fontSize: '3rem' }}>SYSTEM ACCESS</h1>
          <p style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>[ TERMINAL AUTHORIZATION REQUIRED ]</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', border: '1px solid rgba(255,168,0,0.3)', minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#00ffff' }}>
              {logs.map((log, i) => <div key={i}>&gt; {log}</div>)}
              {logs.length === 4 && <div className="glitch-text" style={{ marginTop: '0.5rem' }}>&gt; READY FOR INPUT_</div>}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>SELECT TEAM DESIGNATION</label>
              <select 
                value={team} 
                onChange={e => setTeam(e.target.value)}
                style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.7)', border: '1px solid var(--color-accent)', color: 'white', fontSize: '1.2rem', outline: 'none', cursor: 'pointer' }}
              >
                {Array.from({ length: 30 }).map((_, i) => (
                  <option key={i+1} value={i+1}>TEAM {i + 1} - NEURAL NODE</option>
                ))}
              </select>
            </div>
            
            <button 
              className="hero-cta" 
              style={{ width: '100%', textAlign: 'center', border: 'none', padding: '1.5rem', marginTop: '1rem' }}
              onClick={() => alert(`UPLINK ESTABLISHED: Team ${team}`)}
            >
              INITIALIZE CONNECTION
            </button>
            
            <hr style={{ borderColor: 'var(--color-border)', margin: '1rem 0', opacity: 0.5 }} />
            
            <button 
              className="hero-cta" 
              style={{ width: '100%', textAlign: 'center', background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
              onClick={() => navigate('/admin')}
            >
              ADMIN OVERRIDE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
