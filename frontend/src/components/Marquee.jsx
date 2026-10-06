import React from 'react';

const Marquee = () => {
  const messages = [
    "LOGISTICS UPDATE: FLIGHT NZ001 EN ROUTE TO LHR",
    "STATUS: CUSTOMS CLEARED",
    "QUEUE: 42 PARCELS AWAITING DISPATCH",
    "TRACKING ACTIVE - SATELLITE UPLINK ESTABLISHED",
    "NEXT DEPARTURE: 04:30 GMT"
  ];

  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {/* Double the content for seamless loop */}
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
