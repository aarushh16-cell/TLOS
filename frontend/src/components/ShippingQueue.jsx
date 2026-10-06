import React from 'react';

const ShippingQueue = () => {
  const cards = [
    { origin: 'NOVA', dest: 'BUY', status: 'EXECUTING', id: 'TXN-8842-A' },
    { origin: 'VOLT', dest: 'SELL', status: 'PENDING', id: 'TXN-9910-X' },
    { origin: 'MEDIX', dest: 'HOLD', status: 'LOCKED', id: 'TXN-1123-F' },
  ];

  return (
    <section className="shipping-queue-section" style={{ background: 'transparent' }}>
      <div className="shipping-header">
        <h2>Live Trade Queue</h2>
        <p>[ ACTIVE ORDERS ]</p>
      </div>
      
      <div className="cargo-cards">
        {cards.map((card, idx) => (
          <div key={idx} className="cargo-card">
            <div className="cargo-route">
              <span>{card.origin}</span>
              <span style={{ fontSize: '1.5rem', color: '#fff' }}>⇄</span>
              <span>{card.dest}</span>
            </div>
            
            <div className="cargo-details">
              <div className="detail-row">
                <span className="detail-label">Order ID</span>
                <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{card.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value" style={{ color: 'var(--color-accent)' }}>{card.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority</span>
                <span className="detail-value">HIGH FREQUENCY</span>
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
