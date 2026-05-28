import { ALERT_RED, ENERGY_CYAN } from '../../scene/palette'

interface ParkedEVProps {
  position: [number, number, number]
  rotationY?: number
  bodyColor: string
  length?: number
  width?: number
}

const GLASS = '#0e1a2a'
const TIRE = '#0a0e16'
const HEADLIGHT = '#f5f7d0'

export function ParkedEV({
  position,
  rotationY = 0,
  bodyColor,
  length = 0.88,
  width = 0.45,
}: ParkedEVProps) {
  const bodyHeight = 0.13
  const wheelRadius = Math.max(0.042, width * 0.105)
  const wheelZ = length * 0.31
  const wheelX = width * 0.5 + 0.018
  const wheelWidth = Math.max(0.038, width * 0.1)
  const cabinW = width * 0.72
  const cabinD = length * 0.42

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 1.34, length * 1.08]} />
        <meshBasicMaterial color="#1a2230" transparent opacity={0.24} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.09, 0]} castShadow={false}>
        <boxGeometry args={[width, bodyHeight, length * 0.82]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.145, length * 0.29]} castShadow={false}>
        <boxGeometry args={[width * 0.82, 0.058, length * 0.24]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.148, -length * 0.34]} castShadow={false}>
        <boxGeometry args={[width * 0.86, 0.062, length * 0.18]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0.205, -length * 0.04]} castShadow={false}>
        <boxGeometry args={[cabinW, 0.12, cabinD]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      <mesh position={[0, 0.276, -length * 0.04]} castShadow={false}>
        <boxGeometry args={[cabinW * 0.76, 0.014, cabinD * 0.72]} />
        <meshLambertMaterial color={GLASS} />
      </mesh>
      <mesh position={[0, 0.216, length * 0.18]} castShadow={false}>
        <boxGeometry args={[cabinW * 0.76, 0.054, 0.012]} />
        <meshLambertMaterial color={GLASS} />
      </mesh>
      <mesh position={[0, 0.216, -length * 0.285]} castShadow={false}>
        <boxGeometry args={[cabinW * 0.72, 0.052, 0.012]} />
        <meshLambertMaterial color={GLASS} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`side-window-${side}`} position={[side * (cabinW * 0.5 + 0.022), 0.214, -length * 0.045]} castShadow={false}>
          <boxGeometry args={[0.012, 0.05, cabinD * 0.58]} />
          <meshLambertMaterial color={GLASS} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <mesh key={`headlight-${side}`} position={[side * width * 0.25, 0.125, length * 0.422]}>
          <boxGeometry args={[width * 0.16, 0.034, 0.012]} />
          <meshLambertMaterial color="#fff7d8" emissive={HEADLIGHT} emissiveIntensity={1.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.126, -length * 0.421]}>
        <boxGeometry args={[width * 0.62, 0.028, 0.012]} />
        <meshLambertMaterial color="#240808" emissive={ALERT_RED} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[width * 0.51, 0.143, -length * 0.08]}>
        <boxGeometry args={[0.012, 0.052, length * 0.12]} />
        <meshLambertMaterial color="#03151d" emissive={ENERGY_CYAN} emissiveIntensity={0.95} />
      </mesh>

      {[
        [-wheelX, wheelRadius, -wheelZ],
        [wheelX, wheelRadius, -wheelZ],
        [-wheelX, wheelRadius, wheelZ],
        [wheelX, wheelRadius, wheelZ],
      ].map((wheel, index) => (
        <group key={`wheel-${index}`} position={wheel as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow={false}>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 10]} />
            <meshLambertMaterial color={TIRE} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[wheelRadius * 0.48, wheelRadius * 0.48, wheelWidth + 0.006, 8]} />
            <meshLambertMaterial color="#6f7d8a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
