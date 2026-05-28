import { LegoBody } from './LegoBody'
import type { VariantJitter } from './jitter'

// All 10 Person variant bodies. Each one composes a LegoBody with role-
// specific torso / hip / leg colours plus role-specific hats and accessories.
// Strictly cool palette (navy / slate / silver / white) + a per-instance
// cyan-family accent.

// =============================================================================
// Solar Engineer — white hard hat, navy jumpsuit, clipboard.
// =============================================================================
export function SolarEngineer({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#1a3a5c" hipColor="#0e2440" legColor="#1a3a5c" emblemColor={accent} headColor={skinTone} shoeColor={shoeColor} />
      {/* white hard hat — dome on top */}
      <mesh position={[0, 0.45, 0]} castShadow={false}>
        <sphereGeometry args={[0.062, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      <mesh position={[0, 0.435, 0.015]}>
        <boxGeometry args={[0.13, 0.014, 0.04]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      {/* clipboard held in front */}
      <group position={[0, 0.24, 0.1]} rotation={[Math.PI * 0.15, 0, 0]}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.07, 0.09, 0.008]} />
          <meshLambertMaterial color="#f0f3f7" />
        </mesh>
        <mesh position={[0.02, 0.03, 0.006]}>
          <planeGeometry args={[0.022, 0.015]} />
          <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.0} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// Wind Tech — climbing helmet w/ visor, slate vest w/ reflective bands, carabiner.
// =============================================================================
export function WindTech({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#3a4a5e" hipColor="#2a3340" legColor="#3a4a5e" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.295, 0.041]}>
        <planeGeometry args={[0.115, 0.015]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.255, 0.045]}>
        <planeGeometry args={[0.115, 0.015]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow={false}>
        <cylinderGeometry args={[0.058, 0.06, 0.045, 12]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <mesh position={[0, 0.453, 0]} castShadow={false}>
        <sphereGeometry args={[0.058, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <mesh position={[0, 0.42, 0.058]}>
        <planeGeometry args={[0.09, 0.025]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.075, 0.18, 0.035]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.015, 0.005, 6, 12]} />
        <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
    </>
  )
}

// =============================================================================
// EV Mechanic — baseball cap, dark coveralls, wrench in hand.
// =============================================================================
export function EVMechanic({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#0e2440" hipColor="#0e2440" legColor="#0e2440" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.295, 0.042]}>
        <planeGeometry args={[0.04, 0.04]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[0, 0.435, 0]} castShadow={false}>
        <cylinderGeometry args={[0.055, 0.058, 0.035, 12]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      <mesh position={[0, 0.455, 0]} castShadow={false}>
        <sphereGeometry args={[0.055, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      <mesh position={[0, 0.43, 0.065]}>
        <boxGeometry args={[0.1, 0.01, 0.05]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      <group position={[0.135, 0.22, 0.02]} rotation={[0, 0, -0.25]}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.09, 0.018, 0.012]} />
          <meshLambertMaterial color="#9aa5b2" />
        </mesh>
        <mesh position={[0.04, 0.005, 0]}>
          <boxGeometry args={[0.02, 0.025, 0.014]} />
          <meshLambertMaterial color="#9aa5b2" />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// Drone Operator — headset, light jacket w/ armband, tablet held up.
// =============================================================================
export function DroneOperator({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#c8d0db" hipColor="#3a4a5e" legColor="#3a4a5e" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[-0.085, 0.32, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.024, 0.024, 0.024, 8]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.435, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.054, 0.006, 6, 16, Math.PI]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      <mesh position={[-0.06, 0.4, 0]}>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      <mesh position={[0.06, 0.4, 0]}>
        <sphereGeometry args={[0.013, 8, 8]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      <mesh position={[0.04, 0.4, 0.04]} rotation={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.05, 6]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      <group position={[0, 0.26, 0.1]} rotation={[Math.PI * 0.25, 0, 0]}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.08, 0.06, 0.008]} />
          <meshLambertMaterial color="#22354f" />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.068, 0.048]} />
          <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.4} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// Commander — peaked officer cap, dark suit, tie, shoulder antenna.
// =============================================================================
export function Commander({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#0e1a28" hipColor="#0e1a28" legColor="#0e1a28" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.275, 0.042]}>
        <planeGeometry args={[0.018, 0.1]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[0, 0.44, 0]} castShadow={false}>
        <cylinderGeometry args={[0.058, 0.062, 0.04, 12]} />
        <meshLambertMaterial color="#0e1a28" />
      </mesh>
      <mesh position={[0, 0.465, 0]} castShadow={false}>
        <cylinderGeometry args={[0.058, 0.058, 0.012, 12]} />
        <meshLambertMaterial color="#0e1a28" />
      </mesh>
      <mesh position={[0, 0.425, 0.045]}>
        <boxGeometry args={[0.12, 0.012, 0.04]} />
        <meshLambertMaterial color="#0e1a28" />
      </mesh>
      <mesh position={[0, 0.445, 0.064]}>
        <planeGeometry args={[0.02, 0.014]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0.085, 0.42, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.12, 6]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0.085, 0.485, 0]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={2.0} />
      </mesh>
    </>
  )
}

// =============================================================================
// Safety Guard — peaked guard cap, slate vest with chest emblem, baton on hip.
// =============================================================================
export function SafetyGuard({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#253241" hipColor="#17263a" legColor="#253241" emblemColor={accent} headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.44, 0]} castShadow={false}>
        <cylinderGeometry args={[0.058, 0.062, 0.04, 12]} />
        <meshLambertMaterial color="#506472" />
      </mesh>
      <mesh position={[0, 0.465, 0]} castShadow={false}>
        <cylinderGeometry args={[0.05, 0.05, 0.018, 12]} />
        <meshLambertMaterial color="#9fb6ad" />
      </mesh>
      <mesh position={[0.115, 0.28, 0.03]} rotation={[0, 0, -0.2]} castShadow={false}>
        <boxGeometry args={[0.018, 0.18, 0.012]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
    </>
  )
}

// =============================================================================
// Showroom Guide — light jacket, name-tag, tablet held to one side.
// =============================================================================
export function ShowroomGuide({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#dce5ec" hipColor="#2f465c" legColor="#2f465c" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.306, 0.043]}>
        <planeGeometry args={[0.075, 0.035]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[0, 0.455, 0]} castShadow={false}>
        <boxGeometry args={[0.13, 0.018, 0.08]} />
        <meshLambertMaterial color="#eef3f7" />
      </mesh>
      <group position={[0.115, 0.25, 0.08]} rotation={[0.2, -0.25, -0.08]}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.055, 0.085, 0.008]} />
          <meshLambertMaterial color="#22354f" />
        </mesh>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.044, 0.067]} />
          <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.35} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// Repair Tech — white hard hat, wrench horizontal, tool case under the other arm.
// =============================================================================
export function RepairTech({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#33465c" hipColor="#253241" legColor="#33465c" emblemColor={accent} headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.45, 0]} castShadow={false}>
        <sphereGeometry args={[0.062, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#e5ece8" />
      </mesh>
      <mesh position={[0.13, 0.22, 0.02]} rotation={[0, 0, -0.55]} castShadow={false}>
        <boxGeometry args={[0.1, 0.018, 0.014]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
      <mesh position={[-0.13, 0.23, 0.06]} rotation={[0.1, 0.2, 0.2]} castShadow={false}>
        <boxGeometry args={[0.05, 0.07, 0.028]} />
        <meshLambertMaterial color="#506472" />
      </mesh>
    </>
  )
}

// =============================================================================
// Dispatch Operator — headset, console tablet held up like Drone Op but darker.
// =============================================================================
export function DispatchOperator({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#0e2440" hipColor="#17263a" legColor="#253241" headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.435, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.055, 0.006, 6, 16, Math.PI]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
      <group position={[0, 0.255, 0.1]} rotation={[Math.PI * 0.22, 0, 0]}>
        <mesh castShadow={false}>
          <boxGeometry args={[0.09, 0.065, 0.008]} />
          <meshLambertMaterial color="#0e1a28" />
        </mesh>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.076, 0.05]} />
          <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.5} />
        </mesh>
      </group>
    </>
  )
}

// =============================================================================
// Grid Inspector — white hard hat (brim) + diagonal probe with glowing tip.
// =============================================================================
export function GridInspector({ shoeColor, skinTone, accent }: VariantJitter) {
  return (
    <>
      <LegoBody torsoColor="#2f465c" hipColor="#253241" legColor="#2f465c" emblemColor={accent} headColor={skinTone} shoeColor={shoeColor} />
      <mesh position={[0, 0.45, 0]} castShadow={false}>
        <sphereGeometry args={[0.062, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      <mesh position={[0, 0.438, 0.02]}>
        <boxGeometry args={[0.13, 0.014, 0.04]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      <mesh position={[-0.13, 0.3, 0.025]} rotation={[0.1, 0, 0.55]} castShadow={false}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
      <mesh position={[-0.17, 0.39, 0.03]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.8} />
      </mesh>
    </>
  )
}
