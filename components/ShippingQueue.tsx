'use client';
import React from 'react';

const ShippingQueue = () => {
  const cards = [
    { origin: 'SEED', dest: 'SERIES A', status: 'IN TRANSIT', id: 'TLOS-8842-A' },
    { origin: 'PITCH', dest: 'MARKET', status: 'CUSTOMS', id: 'TLOS-9910-X' },
    { origin: 'MVP', dest: 'PROD', status: 'BOARDING', id: 'TLOS-1123-F' },
  ];

  return (
    <section className="shipping-queue-section">
      <div className="shipping-header">
        <h2>Live Market Queue</h2>
        <p>[ ACTIVE SHIPMENTS ]</p>
      </div>
      
      <div className="cargo-cards">
        {cards.map((card, idx) => (
          <div key={idx} className="cargo-card">
            <div className="cargo-route">
              <span>{card.origin}</span>
              <span style={{ fontSize: '1.5rem', color: '#fff' }}>✈</span>
              <span>{card.dest}</span>
            </div>
            
            <div className="cargo-details">
              <div className="detail-row">
                <span className="detail-label">Tracking ID</span>
                <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{card.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Status</span>
                <span className="detail-value" style={{ color: 'var(--color-accent)' }}>{card.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <span className="detail-value">EXPRESS PLUS</span>
              </div>
            </div>
            
            <div className="cargo-barcode"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShippingQueue;
