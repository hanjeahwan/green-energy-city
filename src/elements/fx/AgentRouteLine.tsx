import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSelectionStore } from '../../scene/selection'
import type { AgentRoute } from '../../scene/agentRoutes'

export function AgentRouteLine({ route }: { route: AgentRoute }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const selectedId = selectedTarget?.id ?? null
  const selected = selectedId === route.fromAnchorId || selectedId === route.toAnchorId
  const targetIntensity = selected ? 0.95 : selectedId === null ? 0.42 : 0.12

  useFrame((s) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = s.clock.getElapsedTime()
    const current = matRef.current.uniforms.uIntensity.value as number
    matRef.current.uniforms.uIntensity.value = current + (targetIntensity - current) * 0.08
  })

  const { positions, progress } = useMemo(() => {
    const points = route.waypoints.map((p) => new THREE.Vector3(...p))
    const positions = new Float32Array(points.length * 3)
    const progress = new Float32Array(points.length)
    const distances = [0]
    let total = 0
    for (let i = 1; i < points.length; i++) {
      total += points[i - 1].distanceTo(points[i])
      distances[i] = total
    }
    points.forEach((point, i) => {
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      progress[i] = total > 0 ? distances[i] / total : 0
    })
    return { positions, progress }
  }, [route])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aProgress" args={[progress, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(route.color) },
          uSpeed: { value: route.speed },
          uIntensity: { value: targetIntensity }
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
            float pulse = smoothstep(0.35, 1.0, sin((vProgress - uTime * uSpeed) * 26.0));
            float lane = 0.16 + pulse * 0.34;
            gl_FragColor = vec4(uColor * (0.55 + pulse * 0.7), lane * uIntensity);
          }
        `}
      />
    </line>
  )
}
