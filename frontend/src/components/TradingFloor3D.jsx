import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars } from '@react-three/drei';

const stocks = [
  { symbol: 'NOVA', color: '#00ffff' },
  { symbol: 'VOLT', color: '#ff00ff' },
  { symbol: 'MEDIX', color: '#00ff00' },
  { symbol: 'FINCO', color: '#ffff00' },
  { symbol: 'FRESH', color: '#ff8800' },
  { symbol: 'SHIPX', color: '#ff0000' }
];

function StockNode({ stock, position }) {
  const meshRef = useRef(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={stock.color} wireframe emissive={stock.color} emissiveIntensity={0.5} />
      </mesh>
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.4}
        color={stock.color}
        anchorX="center"
        anchorY="middle"
      >
        {stock.symbol}
      </Text>
    </Float>
  );
}

export default function TradingFloor3D() {
  const positions = useMemo(() => {
    const arr = [];
    const radius = 5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      arr.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return arr;
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {stocks.map((stock, i) => (
          <StockNode key={stock.symbol} stock={stock} position={positions[i]} />
        ))}

        <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} enablePan={false} />
      </Canvas>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,32,70,0.9), transparent, rgba(11,32,70,0.5))' }} />
    </div>
  );
}
