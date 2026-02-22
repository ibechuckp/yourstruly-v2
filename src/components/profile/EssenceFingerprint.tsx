'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float,
  Sparkles
} from '@react-three/drei'
import * as THREE from 'three'
import { ESSENCE_LAYERS, getLayerValues, getDominantColors, EssenceVector } from '@/lib/essence'

interface EssenceFingerprintProps {
  essenceVector: EssenceVector
  size?: number
  className?: string
}

// Colors for the YT palette
const YT_COLORS = {
  sage: '#406A56',
  gold: '#D9C61A', 
  copper: '#C35F33',
  plum: '#4A3552',
  teal: '#8DACAB'
}

/**
 * Generate points for a single layer's organic shape
 */
function generateLayerGeometry(
  layerValues: number[],
  layerIndex: number,
  baseRadius: number,
  heightOffset: number
): THREE.BufferGeometry {
  const segments = 64
  const layers = 8
  const positions: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  
  // Interpolate values across segments
  const interpolatedValues: number[] = []
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * layerValues.length
    const idx = Math.floor(t)
    const frac = t - idx
    const v1 = layerValues[idx % layerValues.length]
    const v2 = layerValues[(idx + 1) % layerValues.length]
    interpolatedValues.push(v1 * (1 - frac) + v2 * frac)
  }
  
  // Generate vertices
  for (let y = 0; y <= layers; y++) {
    const yNorm = y / layers
    const yPos = (yNorm - 0.5) * 0.3 + heightOffset
    
    for (let x = 0; x <= segments; x++) {
      const xNorm = x / segments
      const angle = xNorm * Math.PI * 2
      
      // Get interpolated dimension value for this angle
      const dimValue = interpolatedValues[x % segments]
      
      // Create organic ridges based on dimension values
      const ridgeAmplitude = 0.15 + dimValue * 0.25
      const waveFreq = 3 + layerIndex * 1.5
      const ridgeEffect = Math.sin(angle * waveFreq) * ridgeAmplitude * dimValue
      
      // Radial distance with organic variation
      const radiusVariation = 1 + ridgeEffect + Math.sin(yNorm * Math.PI) * 0.1
      const radius = baseRadius * radiusVariation
      
      // Helix twist for DNA-like feel
      const twist = yNorm * Math.PI * 0.5 * (layerIndex % 2 === 0 ? 1 : -1)
      const twistedAngle = angle + twist
      
      const px = Math.cos(twistedAngle) * radius
      const pz = Math.sin(twistedAngle) * radius
      const py = yPos
      
      positions.push(px, py, pz)
      
      // Normal pointing outward with some variation
      const nx = Math.cos(twistedAngle)
      const nz = Math.sin(twistedAngle)
      const ny = 0.2 * Math.sin(yNorm * Math.PI)
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      normals.push(nx / len, ny / len, nz / len)
      
      uvs.push(xNorm, yNorm)
    }
  }
  
  // Generate indices
  for (let y = 0; y < layers; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x
      const b = a + 1
      const c = a + segments + 1
      const d = c + 1
      
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  
  return geometry
}

/**
 * Single essence layer mesh
 */
function EssenceLayer({ 
  layerValues, 
  layerIndex, 
  color,
  totalLayers 
}: {
  layerValues: number[]
  layerIndex: number
  color: string
  totalLayers: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const baseRadius = 0.3 + layerIndex * 0.2
  const heightOffset = (layerIndex - totalLayers / 2) * 0.15
  
  const geometry = useMemo(() => 
    generateLayerGeometry(layerValues, layerIndex, baseRadius, heightOffset),
    [layerValues, layerIndex, baseRadius, heightOffset]
  )
  
  // Individual layer rotation
  useFrame((state) => {
    if (meshRef.current) {
      const speed = 0.1 + layerIndex * 0.02
      const direction = layerIndex % 2 === 0 ? 1 : -1
      meshRef.current.rotation.y += speed * 0.005 * direction
      
      // Subtle breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5 + layerIndex) * 0.02
      meshRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshTransmissionMaterial
        color={color}
        thickness={0.2}
        roughness={0.1}
        transmission={0.8}
        ior={1.5}
        chromaticAberration={0.03}
        backside={true}
        backsideThickness={0.1}
        samples={4}
      />
    </mesh>
  )
}

/**
 * Core essence shape - crystalline aurora
 */
function EssenceCore({ 
  essenceVector,
  dominantColors 
}: { 
  essenceVector: EssenceVector
  dominantColors: string[]
}) {
  const coreRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  
  // Slow rotation
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.003
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.005
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05
      innerRef.current.scale.setScalar(pulse * 0.25)
    }
  })
  
  // Extract layer values
  const layers = useMemo(() => {
    return Object.keys(ESSENCE_LAYERS).map((key, index) => ({
      key,
      values: getLayerValues(essenceVector, key as keyof typeof ESSENCE_LAYERS),
      color: ESSENCE_LAYERS[key as keyof typeof ESSENCE_LAYERS].color,
      index
    }))
  }, [essenceVector])
  
  return (
    <group ref={coreRef}>
      {/* Inner glowing core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={dominantColors[0]}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Essence layers */}
      {layers.map((layer) => (
        <EssenceLayer
          key={layer.key}
          layerValues={layer.values}
          layerIndex={layer.index}
          color={layer.color}
          totalLayers={layers.length}
        />
      ))}
      
      {/* Ambient sparkles */}
      <Sparkles
        count={30}
        scale={2.5}
        size={2}
        speed={0.3}
        color={dominantColors[0]}
        opacity={0.6}
      />
    </group>
  )
}

/**
 * Loading fallback
 */
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={YT_COLORS.sage}
        wireframe
        transparent
        opacity={0.5}
      />
    </mesh>
  )
}

/**
 * Main scene
 */
function EssenceScene({ essenceVector }: { essenceVector: EssenceVector }) {
  const dominantColors = useMemo(() => getDominantColors(essenceVector), [essenceVector])
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#fff" />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color={dominantColors[0]} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color={dominantColors[1]} />
      
      {/* Environment for reflections */}
      <Environment preset="sunset" />
      
      {/* Floating effect */}
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.3}
      >
        <Suspense fallback={<LoadingFallback />}>
          <EssenceCore 
            essenceVector={essenceVector}
            dominantColors={dominantColors}
          />
        </Suspense>
      </Float>
    </>
  )
}

/**
 * Main component - Essence Fingerprint 3D Visualization
 */
export default function EssenceFingerprint({ 
  essenceVector, 
  size = 200,
  className = ''
}: EssenceFingerprintProps) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow effect background */}
      <div 
        className="absolute inset-0 rounded-full opacity-30 blur-xl"
        style={{
          background: `radial-gradient(circle, ${YT_COLORS.sage}40 0%, transparent 70%)`
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <EssenceScene essenceVector={essenceVector} />
      </Canvas>
    </div>
  )
}

/**
 * Client-only wrapper to prevent SSR issues
 */
export function EssenceFingerprintClient(props: EssenceFingerprintProps) {
  return (
    <Suspense fallback={
      <div 
        className={`relative ${props.className || ''}`}
        style={{ width: props.size || 200, height: props.size || 200 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#406A56]/30 border-t-[#406A56] animate-spin" />
        </div>
      </div>
    }>
      <EssenceFingerprint {...props} />
    </Suspense>
  )
}
