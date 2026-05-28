import { ACCENT_CYAN } from '../buildings/catalog'

// Shared Lego-minifigure skeleton — feet, legs, hip, torso, arms, hands, head.
// Per-role variants override torsoColor / hipColor / legColor / emblemColor /
// headColor / shoeColor and add hats / accessories on top.

export interface LegoBodyProps {
  torsoColor: string
  hipColor: string
  legColor: string
  emblemColor?: string  // optional emblem on chest
  headColor?: string    // default light skin
  shoeColor?: string    // per-instance jitter (default dark slate)
}

export function LegoBody({
  torsoColor,
  hipColor,
  legColor,
  emblemColor,
  headColor = '#e6c5a4',
  shoeColor = '#2a2f38',
}: LegoBodyProps) {
  return (
    <>
      {/* feet — 2 small dark boxes (per-instance shoeColor) */}
      <mesh position={[-0.035, 0.012, 0]} castShadow={false}>
        <boxGeometry args={[0.05, 0.025, 0.07]} />
        <meshLambertMaterial color={shoeColor} />
      </mesh>
      <mesh position={[0.035, 0.012, 0]} castShadow={false}>
        <boxGeometry args={[0.05, 0.025, 0.07]} />
        <meshLambertMaterial color={shoeColor} />
      </mesh>
      {/* legs */}
      <mesh position={[-0.035, 0.1, 0]} castShadow={false}>
        <cylinderGeometry args={[0.025, 0.025, 0.13, 8]} />
        <meshLambertMaterial color={legColor} />
      </mesh>
      <mesh position={[0.035, 0.1, 0]} castShadow={false}>
        <cylinderGeometry args={[0.025, 0.025, 0.13, 8]} />
        <meshLambertMaterial color={legColor} />
      </mesh>
      {/* hip block */}
      <mesh position={[0, 0.185, 0]} castShadow={false}>
        <boxGeometry args={[0.13, 0.04, 0.07]} />
        <meshLambertMaterial color={hipColor} />
      </mesh>
      {/* torso — trapezoid (slightly narrower at top) */}
      <mesh position={[0, 0.275, 0]} castShadow={false}>
        <cylinderGeometry args={[0.062, 0.075, 0.13, 4, 1]} />
        <meshLambertMaterial color={torsoColor} flatShading />
      </mesh>
      {/* chest emblem (optional) */}
      {emblemColor && (
        <mesh position={[0, 0.29, 0.04]}>
          <planeGeometry args={[0.05, 0.05]} />
          <meshLambertMaterial color="#000" emissive={emblemColor} emissiveIntensity={1.0} />
        </mesh>
      )}
      {/* arms */}
      <mesh position={[-0.085, 0.28, 0]} rotation={[0, 0, 0.18]} castShadow={false}>
        <cylinderGeometry args={[0.022, 0.022, 0.13, 8]} />
        <meshLambertMaterial color={torsoColor} />
      </mesh>
      <mesh position={[0.085, 0.28, 0]} rotation={[0, 0, -0.18]} castShadow={false}>
        <cylinderGeometry args={[0.022, 0.022, 0.13, 8]} />
        <meshLambertMaterial color={torsoColor} />
      </mesh>
      {/* hands */}
      <mesh position={[-0.105, 0.215, 0]} castShadow={false}>
        <boxGeometry args={[0.035, 0.035, 0.035]} />
        <meshLambertMaterial color={headColor} />
      </mesh>
      <mesh position={[0.105, 0.215, 0]} castShadow={false}>
        <boxGeometry args={[0.035, 0.035, 0.035]} />
        <meshLambertMaterial color={headColor} />
      </mesh>
      {/* neck stub */}
      <mesh position={[0, 0.355, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.025, 8]} />
        <meshLambertMaterial color="#5a4030" />
      </mesh>
      {/* head — cylinder (Lego studless style) */}
      <mesh position={[0, 0.4, 0]} castShadow={false}>
        <cylinderGeometry args={[0.055, 0.055, 0.07, 12]} />
        <meshLambertMaterial color={headColor} />
      </mesh>
      {/* tiny cyan eyes */}
      <mesh position={[-0.018, 0.41, 0.054]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshLambertMaterial color="#1a1a1a" emissive={ACCENT_CYAN} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.018, 0.41, 0.054]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshLambertMaterial color="#1a1a1a" emissive={ACCENT_CYAN} emissiveIntensity={0.6} />
      </mesh>
    </>
  )
}
