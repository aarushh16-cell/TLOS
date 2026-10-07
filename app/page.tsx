"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Stars, Grid } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 3D Candlestick Component (Classic Green/Red)
function Candlestick({ position, scale = 1, isUp = true, delay = 0 }: any) {
  const group = useRef<THREE.Group>(null);
  const bodyHeight = 1 + Math.random() * 2;
  const wickHeight = bodyHeight + 1 + Math.random() * 1.5;
  
  const color = isUp ? "#10b981" : "#ef4444"; 
  
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = position[1] + Math.sin(t * 2 + delay) * 0.2;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Wick */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, wickHeight, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Body */}
      <mesh position={[0, (Math.random() - 0.5) * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, bodyHeight, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

function MarketCityscape() {
  const candles = useMemo(() => {
    const temp = [];
    const gridSize = 12;
    const spacing = 1.5;
    
    for (let x = -gridSize/2; x < gridSize/2; x++) {
      for (let z = -gridSize/2; z < gridSize/2; z++) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        const dist = Math.sqrt(x*x + z*z);
        if (Math.random() > 0.4) {
          temp.push({
            position: [x * spacing, 0, z * spacing],
            isUp: Math.random() > 0.4,
            scale: 0.5 + Math.random() + (dist * 0.1),
            delay: Math.random() * Math.PI * 2
          });
        }
      }
    }
    return temp;
  }, []);

  return (
    <group>
      {/* Abstract Tech Grid Floor - Dark Theme */}
      <Grid 
        infiniteGrid 
        fadeDistance={40} 
        sectionColor="#27272a" 
        cellColor="#121214" 
        position={[0, -1, 0]} 
        cellSize={1} 
        sectionSize={5} 
      />

      {/* Floating Data Nodes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <Float key={`data-${i}`} speed={3} rotationIntensity={2} floatIntensity={2} position={[(Math.random() - 0.5) * 30, Math.random() * 10, (Math.random() - 0.5) * 30]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.15]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.8} />
          </mesh>
        </Float>
      ))}

      {candles.map((props, i) => (
        <Candlestick key={i} {...props} />
      ))}
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.1) * 12;
    state.camera.position.z = Math.cos(t * 0.1) * 12;
    state.camera.position.y = 4 + Math.sin(t * 0.2) * 1;
    state.camera.lookAt(0, 2, 0);
  });
  return null;
}

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDeploy = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/login');
    }, 600);
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0a0b] overflow-hidden font-sans text-zinc-100">
      
      {/* Fade Out Overlay during transition */}
      <div 
        className={`absolute inset-0 z-50 bg-[#0a0a0b] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      ></div>

      {/* 3D Canvas Background (Disabled on Mobile) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0b] via-[#121214] to-[#0a0a0b]">
        {mounted && !isMobile && (
          <Canvas shadows camera={{ position: [0, 5, 15], fov: 50 }}>
            <fog attach="fog" args={['#0a0a0b', 10, 40]} />
            <ambientLight intensity={0.4} />
            <directionalLight 
              castShadow 
              position={[10, 20, 10]} 
              intensity={2} 
              color="#ffffff"
              shadow-mapSize={[1024, 1024]}
            />
            <Environment preset="night" />
            <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />
            <MarketCityscape />
            <CameraRig />
          </Canvas>
        )}
        
        {/* Mobile Fallback Graphic (when 3D is disabled) */}
        {mounted && isMobile && (
          <div className="absolute inset-0 overflow-hidden flex flex-col justify-between py-20 opacity-20 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-[200%] h-px bg-emerald-500/30 transform -rotate-12 translate-y-[100px] -translate-x-[100px]" style={{ marginTop: i * 40 }}></div>
            ))}
          </div>
        )}
      </div>

      {/* Clean Pill Navigation */}
      <div className="absolute top-4 sm:top-8 left-0 right-0 z-10 flex justify-center pointer-events-none px-2">
        <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 sm:p-1.5 pointer-events-auto shadow-xl">
          <Link href="/board" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase">
            Leaderboard
          </Link>
          <Link href="/login" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider text-white bg-white/10 transition-all uppercase shadow-inner">
            Simulation
          </Link>
          <Link href="/rules" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase">
            Rules
          </Link>
        </nav>
      </div>

      {/* Title & Enter Button Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center pointer-events-none px-6 md:px-20 lg:px-32">
        
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 p-8 sm:p-12 rounded-[2rem] flex flex-col items-start text-left w-full max-w-2xl transform hover:scale-[1.01] transition-transform duration-500 shadow-[0_0_80px_rgba(16,185,129,0.05)] relative overflow-hidden group">
          {/* Subtle gradient glow behind the panel */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-1000 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-6 bg-white/5 border border-white/5 px-3 sm:px-5 py-2 rounded-full relative z-10 shadow-inner">
             <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
             <span className="text-emerald-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Live Hackathon Environment</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] leading-[0.9] font-black tracking-tighter mb-6 relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-500" style={{ textShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            THE LAST ONE<br/>STANDING
          </h1>
          
          <div className="w-12 h-1 bg-emerald-500 mb-6 rounded-full relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          
          <p className="text-zinc-300 text-sm sm:text-lg md:text-xl font-medium mb-10 max-w-lg relative z-10 leading-relaxed">
            A high-stakes market simulation. Manage ₹10,00,000 across 6 dynamic assets. Trade, strategize, and outlast the competition.
          </p>
          
          <button 
            onClick={handleDeploy}
            disabled={isTransitioning}
            className="pointer-events-auto relative z-10 overflow-hidden px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:-translate-y-1 group/btn border border-white/20"
          >
            <span className="relative z-10 group-hover/btn:text-white transition-colors duration-300">Deploy Terminal</span>
            <div className="absolute inset-0 bg-emerald-500 transform scale-x-0 group-hover/btn:scale-x-100 origin-left transition-transform duration-300 ease-out z-0"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
