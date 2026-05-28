import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function PowerFlowLine({
  from,
  to,
  color,
  speed = 0.4,
  intensity = 1.0,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  speed?: number
  /** 1.0 = normal; >1 boosts amplitude (selected); <1 dims (non-selected). */
  intensity?: number
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const targetColor = useMemo(() => new THREE.Color(color), [color])
  useFrame((s) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = s.clock.getElapsedTime()
      // Smoothly lerp uIntensity toward target so selection changes fade
      // rather than snap. 0.1 lerp factor ≈ 350ms settle at 60fps.
      const cur = matRef.current.uniforms.uIntensity.value as number
      matRef.current.uniforms.uIntensity.value = cur + (intensity - cur) * 0.1
      // Same lerp on colour so green→cyan swap fades.
      ;(matRef.current.uniforms.uColor.value as THREE.Color).lerp(targetColor, 0.1)
    }
  })
  const { positions, uvs } = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    mid.y = Math.max(start.y, end.y) + 1.0
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const pts = curve.getPoints(48)
    const positions = new Float32Array(pts.length * 3)
    const uvs = new Float32Array(pts.length)
    pts.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      uvs[i] = i / (pts.length - 1)
    })
    return { positions, uvs }
  }, [from, to])
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aProgress" args={[uvs, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uSpeed: { value: speed },
          uIntensity: { value: intensity }
        }}
        vertexShader={`
          attribute float aProgress;
          varying float vProgress;
          void main() {
            vProgress = aProgress;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying float vProgress;
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uSpeed;
          uniform float uIntensity;
          void main() {
            float wave = sin((vProgress - uTime * uSpeed) * 18.0);
            float head = smoothstep(0.5, 1.0, wave);
            float base = (0.25 + head * 0.85) * uIntensity;
            gl_FragColor = vec4(uColor * base, base);
          }
        `}
      />
    </line>
  )
}
