"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Stars, Grid } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
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

      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
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
      </div>

      {/* Clean Pill Navigation */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <nav className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1.5 pointer-events-auto shadow-xl">
          <Link href="/board" className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase">
            Leaderboard
          </Link>
          <Link href="/login" className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider text-white bg-white/10 transition-all uppercase shadow-inner">
            Simulation
          </Link>
          <Link href="/rules" className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 transition-all uppercase">
            Rules
          </Link>
        </nav>
      </div>

      {/* Title & Enter Button Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        
        <div className="backdrop-blur-md bg-black/20 border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center max-w-2xl transform hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
          <div className="flex items-center gap-3 mb-4 bg-white/5 px-4 py-1.5 rounded-full">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">Live Hackathon Environment</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            TLOS ROUND 4
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl font-medium mb-10 max-w-md">
            The Market: A streamlined investment simulation. Manage ₹10,00,000 across 6 fictional stocks. Trade, strategize, and conquer the leaderboard!
          </p>
          
          <button 
            onClick={handleDeploy}
            disabled={isTransitioning}
            className="pointer-events-auto px-10 py-4 bg-white text-black rounded-full font-bold text-sm tracking-widest uppercase hover:bg-emerald-400 hover:text-white transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.3)]"
          >
            Deploy Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
