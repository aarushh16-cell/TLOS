import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-crop-frame">
        <div className="hero-crop-tl"></div>
        <div className="hero-crop-bl"></div>
        
        <h1 className="hero-title">
          TLOS:<br />
          MARKET<br />
          SIMULATION
        </h1>
        <p className="hero-subtitle">
          Live Hackathon Business Competition. Trade stocks, build your portfolio, and outsmart the market.
        </p>
        <Link to="/login" className="hero-cta" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Access Terminal
        </Link>
      </div>
    </section>
  );
};

export default Hero;
