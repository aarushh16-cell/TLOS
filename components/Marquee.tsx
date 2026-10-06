'use client';
import React from 'react';

const Marquee = () => {
  const messages = [
    "LOGISTICS UPDATE: TLOS MARKET SIMULATION ACTIVE",
    "STATUS: ALL TEAMS ONBOARDED",
    "QUEUE: LIVE TRADING COMMENCES SOON",
    "TRACKING ACTIVE - UPLINK ESTABLISHED",
    "NEXT DEPARTURE: SEED FUNDING ROUND"
  ];

  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {[...messages, ...messages].map((msg, idx) => (
          <div key={idx} className="marquee-item">
            <span>{msg}</span>
            <span className="marquee-dot"></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
