'use client';
import React from 'react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-crop-frame">
        <div className="hero-crop-tl"></div>
        <div className="hero-crop-bl"></div>
        
        <h1 className="hero-title">
          THE LIVE<br />
          OPERATING<br />
          SYSTEM
        </h1>
        <p className="hero-subtitle">
          Premium market simulation and hackathon logistics. Fast, reliable, and highly competitive.
        </p>
        <Link href="/login" className="hero-cta">
          Access Terminal
        </Link>
      </div>
    </section>
  );
};

export default Hero;
