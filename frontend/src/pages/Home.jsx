import React from 'react'
import Marquee from '../components/Marquee'
import Hero from '../components/Hero'
import ShippingQueue from '../components/ShippingQueue'
import TradingFloor3D from '../components/TradingFloor3D'

export default function Home() {
  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <TradingFloor3D />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Marquee />
        <main>
          <Hero />
          <ShippingQueue />
        </main>
      </div>
    </div>
  )
}
