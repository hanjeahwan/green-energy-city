import { useMemo, useRef } from 'react'
import { useThrottledFrame } from '../../scene/throttledFrame'
import * as THREE from 'three'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { CLEAN_GREEN } from '../../scene/palette'
import { AgentBeacon } from '../AgentBeacon'
import { ACCENT_CYAN } from './catalog'

export function PeripheralStyleCommandTower() {
  const podiumHeight = 0.42
  const slabHeight = 5.35
  const crownHeight = 0.34
  const slabW = 0.54
  const slabD = 1.28
  const gap = 0.22
  const slabX = (slabW + gap) / 2
  const podiumW = 1.86
  const podiumD = 1.58
  const totalHeight = podiumHeight + slabHeight + crownHeight

  const slabGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(slabW, slabHeight, slabD)
    return tintedGeometry(g, '#b8c7d4', 0.52)
  }, [])
  const crownGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(slabW * 0.9, crownHeight, slabD * 0.86)
    return tintedGeometry(g, '#d5e0e8', 0.56)
  }, [])
  const towerMat = useMemo(() => flatGradMat({ roughness: 0.76, metalness: 0.04 }), [])
  const crownMat = useMemo(() => flatGradMat({ roughness: 0.7, metalness: 0.1 }), [])
  const darkTrimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#354353', roughness: 0.82 }), [])
  const cyanLineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#07131f',
    emissive: new THREE.Color(ACCENT_CYAN),
    emissiveIntensity: 0.46,
    roughness: 0.42,
    side: THREE.DoubleSide
  }), [])
  const greenSpineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#061523',
    emissive: new THREE.Color(CLEAN_GREEN),
    emissiveIntensity: 0.9,
    roughness: 0.36,
    side: THREE.DoubleSide
  }), [])
  const radarOrbMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: ACCENT_CYAN,
    emissive: new THREE.Color(ACCENT_CYAN),
    emissiveIntensity: 4.2,
    roughness: 0.18
  }), [])
  const radarLightRef = useRef<THREE.PointLight>(null)
  const bandYs = useMemo(
    () => [1.25, 2.35, 3.45, 4.55].map((y) => podiumHeight + y),
    []
  )
  const slabPositions = [-slabX, slabX] as const

  useThrottledFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = (Math.sin(t * 4.6) + 1) * 0.5
    radarOrbMat.emissiveIntensity = 2.2 + pulse * 5.4
    if (radarLightRef.current) {
      radarLightRef.current.intensity = 0.8 + pulse * 2.6
    }
  }, 20)

  return (
    <group position={[0, 0, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={1.5} opacity={0.38} />
      <mesh position={[0, podiumHeight / 2, 0]} material={darkTrimMat} castShadow receiveShadow>
        <boxGeometry args={[podiumW, podiumHeight, podiumD]} />
      </mesh>
      <mesh position={[0, podiumHeight * 0.55, -(podiumD / 2 + 0.02)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[podiumW * 0.58, 0.11]} />
        <meshLambertMaterial color="#07131f" emissive={CLEAN_GREEN} emissiveIntensity={0.7} />
      </mesh>

      {slabPositions.map((x, i) => (
        <mesh key={i} position={[x, podiumHeight + slabHeight / 2, 0]} geometry={slabGeom} material={towerMat} castShadow receiveShadow />
      ))}

      {bandYs.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={cyanLineMat}>
          <boxGeometry args={[slabX * 2 + slabW + 0.035, 0.034, slabD + 0.035]} />
        </mesh>
      ))}

      {slabPositions.map((x, i) => (
        <mesh
          key={i}
          position={[x, podiumHeight + slabHeight + crownHeight / 2, 0]}
          geometry={crownGeom}
          material={crownMat}
          castShadow
          receiveShadow
        />
      ))}
      <mesh position={[0, podiumHeight + slabHeight + 0.045, 0]} material={darkTrimMat} castShadow>
        <boxGeometry args={[slabX * 2 + slabW + 0.16, 0.09, slabD + 0.12]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.035, 0]} material={darkTrimMat} castShadow>
        <boxGeometry args={[slabX * 2 + slabW * 0.9 + 0.1, 0.07, slabD * 0.9]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.095, 0]} material={darkTrimMat} castShadow>
        <boxGeometry args={[slabX * 2 + slabW * 0.54, 0.075, slabD * 0.64]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.136, 0]} material={greenSpineMat}>
        <boxGeometry args={[slabX * 2 + slabW * 0.34, 0.018, slabD * 0.42]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.1, -(slabD * 0.42 + 0.008)]} rotation={[0, Math.PI, 0]} material={greenSpineMat}>
        <planeGeometry args={[slabX * 2 + slabW * 0.48, 0.055]} />
      </mesh>
      {slabPositions.map((x, i) => (
        <mesh key={i} position={[x, podiumHeight + slabHeight + crownHeight * 0.55, -(slabD * 0.43 + 0.007)]} rotation={[0, Math.PI, 0]} material={cyanLineMat}>
          <planeGeometry args={[slabW * 0.68, 0.075]} />
        </mesh>
      ))}
      {[-0.54, -0.18, 0.18, 0.54].map((x, i) => (
        <mesh key={`screen-${i}`} position={[x, podiumHeight + 0.12, podiumD / 2 + 0.02]}>
          <planeGeometry args={[0.22, 0.1]} />
          <meshLambertMaterial color="#041018" emissive={i % 2 === 0 ? ACCENT_CYAN : CLEAN_GREEN} emissiveIntensity={0.9} />
        </mesh>
      ))}
      <mesh position={[0, totalHeight + 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.68, 8]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      <mesh position={[0, totalHeight + 0.83, 0]} material={radarOrbMat}>
        <sphereGeometry args={[0.07, 12, 12]} />
      </mesh>
      <pointLight ref={radarLightRef} position={[0, totalHeight + 0.83, 0]} color={ACCENT_CYAN} distance={1.6} decay={2} intensity={1.8} />
      <AgentBeacon position={[0.72, 0, 0.52]} color={ACCENT_CYAN} scale={0.72} />
    </group>
  )
}

export function CommandTower() {
  const ribMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#07131f',
    emissive: new THREE.Color(ACCENT_CYAN),
    emissiveIntensity: 0.95,
    roughness: 0.38,
    metalness: 0.25
  }), [])
  useThrottledFrame((s) => {
    ribMat.emissiveIntensity = 0.95 + Math.sin(s.clock.getElapsedTime() * 1.8) * 0.3
  }, 20)

  const baseGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(1.12, 1.52, 0.58, 8)
    g.translate(0, 0.29, 0)
    return tintedGeometry(g, '#dfe8ef', 0.48)
  }, [])
  const shaftGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.56, 0.76, 3.45, 6)
    g.translate(0, 2.34, 0)
    return tintedGeometry(g, '#d9e6ef', 0.42)
  }, [])
  const commandDeckGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(1.34, 1.02, 0.82, 8)
    g.translate(0, 4.42, 0)
    return tintedGeometry(g, '#edf4f8', 0.5)
  }, [])
  const neckGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.72, 0.48, 0.36, 8)
    g.translate(0, 3.83, 0)
    return tintedGeometry(g, '#a7b7c6', 0.5)
  }, [])
  const baseMat = useMemo(() => flatGradMat({ roughness: 0.74, metalness: 0.12 }), [])
  const shaftMat = useMemo(() => new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.58,
    metalness: 0.16,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color(ACCENT_CYAN),
    emissiveIntensity: 0.06
  }), [])
  const commandDeckMat = useMemo(() => flatGradMat({ roughness: 0.62, metalness: 0.22, emissive: ACCENT_CYAN, emissiveIntensity: 0.05 }), [])
  const darkMetalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#24344a', roughness: 0.68, metalness: 0.32 }), [])
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0f2e49',
    roughness: 0.22,
    metalness: 0.65,
    transparent: true,
    opacity: 0.88,
    emissive: new THREE.Color(ACCENT_CYAN),
    emissiveIntensity: 0.18
  }), [])
  const spineMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#061523',
    roughness: 0.3,
    metalness: 0.55,
    emissive: new THREE.Color(CLEAN_GREEN),
    emissiveIntensity: 0.42
  }), [])
  const lightRibs = [
    [0.47, 2.35, 0.47] as [number, number, number],
    [-0.47, 2.35, 0.47] as [number, number, number],
    [0.47, 2.35, -0.47] as [number, number, number],
    [-0.47, 2.35, -0.47] as [number, number, number]
  ] as const
  const supportBlades = [
    { p: [0, 2.3, 0.76] as [number, number, number], r: [0.12, 0, 0] as [number, number, number], s: [0.18, 3.38, 0.16] as [number, number, number] },
    { p: [0, 2.3, -0.76] as [number, number, number], r: [-0.12, 0, 0] as [number, number, number], s: [0.18, 3.38, 0.16] as [number, number, number] },
    { p: [0.76, 2.3, 0] as [number, number, number], r: [0, 0, -0.12] as [number, number, number], s: [0.16, 3.38, 0.18] as [number, number, number] },
    { p: [-0.76, 2.3, 0] as [number, number, number], r: [0, 0, 0.12] as [number, number, number], s: [0.16, 3.38, 0.18] as [number, number, number] }
  ] as const
  const deckPanels = [
    { p: [0, 4.43, 1.075] as [number, number, number], r: 0, w: 1.24 },
    { p: [0, 4.43, -1.075] as [number, number, number], r: Math.PI, w: 1.24 },
    { p: [1.075, 4.43, 0] as [number, number, number], r: Math.PI / 2, w: 1.24 },
    { p: [-1.075, 4.43, 0] as [number, number, number], r: -Math.PI / 2, w: 1.24 },
    { p: [0.76, 4.43, 0.76] as [number, number, number], r: Math.PI / 4, w: 0.62 },
    { p: [-0.76, 4.43, 0.76] as [number, number, number], r: -Math.PI / 4, w: 0.62 },
    { p: [0.76, 4.43, -0.76] as [number, number, number], r: -Math.PI / 4, w: 0.62 },
    { p: [-0.76, 4.43, -0.76] as [number, number, number], r: Math.PI / 4, w: 0.62 }
  ] as const
  const shaftPanels = [
    { p: [0, 2.32, 0.58] as [number, number, number], r: 0 },
    { p: [0.58, 2.32, 0] as [number, number, number], r: Math.PI / 2 },
    { p: [0, 2.32, -0.58] as [number, number, number], r: Math.PI }
  ] as const

  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={2.05} opacity={0.4} />

      <mesh geometry={baseGeom} material={baseMat} castShadow receiveShadow />
      <mesh position={[0, 0.66, 0]} material={darkMetalMat} castShadow>
        <cylinderGeometry args={[0.94, 1.12, 0.16, 8]} />
      </mesh>
      <mesh position={[0, 0.72, 0.78]}>
        <planeGeometry args={[0.64, 0.16]} />
        <meshLambertMaterial color="#07131f" emissive={CLEAN_GREEN} emissiveIntensity={0.7} />
      </mesh>

      <mesh geometry={shaftGeom} material={shaftMat} castShadow receiveShadow />
      {supportBlades.map((blade, i) => (
        <mesh key={i} position={blade.p} rotation={blade.r} material={darkMetalMat} castShadow>
          <boxGeometry args={blade.s} />
        </mesh>
      ))}
      <mesh position={[0, 2.45, 0]} material={spineMat} castShadow>
        <boxGeometry args={[0.34, 3.52, 0.34]} />
      </mesh>
      {lightRibs.map((p, i) => (
        <mesh key={i} position={p} material={ribMat} castShadow>
          <boxGeometry args={[0.06, 3.48, 0.06]} />
        </mesh>
      ))}
      {shaftPanels.map((panel, i) => (
        <mesh key={i} position={panel.p} rotation={[0, panel.r, 0]}>
          <planeGeometry args={[0.42, 2.34]} />
          <meshLambertMaterial color="#123153" transparent opacity={0.86} emissive={ACCENT_CYAN} emissiveIntensity={0.16} />
        </mesh>
      ))}

      <mesh geometry={neckGeom} material={darkMetalMat} castShadow receiveShadow />
      <mesh position={[0, 3.97, 0]} material={darkMetalMat} castShadow>
        <cylinderGeometry args={[1.0, 0.74, 0.16, 8]} />
      </mesh>
      <mesh geometry={commandDeckGeom} material={commandDeckMat} castShadow receiveShadow />
      {deckPanels.map((panel, i) => (
        <mesh key={i} position={panel.p} rotation={[0, panel.r, 0]} material={glassMat}>
          <planeGeometry args={[panel.w, 0.48]} />
        </mesh>
      ))}
      <mesh position={[0, 4.43, 0.02]} material={spineMat} castShadow>
        <boxGeometry args={[0.18, 0.9, 2.05]} />
      </mesh>
      <mesh position={[0, 4.88, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.22, 0.08, 8]} />
        <meshLambertMaterial color="#66798b" />
      </mesh>
    </group>
  )
}
