import * as THREE from 'three'

/**
 * Bake vertex colors onto geometry by world-Y position.
 * Top of bounding box gets `topHex`, bottom gets `topHex * factor`.
 * Produces Runjian-style "lit top, shaded bottom" gradient without lights.
 */
export function tintedGeometry(
  geom: THREE.BufferGeometry,
  topHex: string,
  bottomFactor: number = 0.55
): THREE.BufferGeometry {
  geom.computeBoundingBox()
  const bb = geom.boundingBox!
  const minY = bb.min.y
  const maxY = bb.max.y
  const range = Math.max(0.001, maxY - minY)

  const top = new THREE.Color(topHex)
  const bottom = top.clone().multiplyScalar(bottomFactor)

  const pos = geom.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = (y - minY) / range
    tmp.copy(bottom).lerp(top, t)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geom
}

/**
 * Shared flat-shaded vertex-color material factory.
 *
 * Switched from MeshStandardMaterial (PBR) to MeshLambertMaterial: the scene
 * is uniformly low-poly with flat shading, metalness/roughness were doing
 * nothing visible on building bodies, and Lambert's fragment shader is
 * roughly 3-5x cheaper per pixel. Emissive + vertexColors + flatShading
 * all survive the swap; the now-meaningless `roughness` / `metalness`
 * options are accepted (for caller compat) but ignored.
 */
export function flatGradMat(opts: {
  roughness?: number
  metalness?: number
  emissive?: string
  emissiveIntensity?: number
} = {}): THREE.MeshLambertMaterial {
  void opts.roughness
  void opts.metalness
  return new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
    emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color(0, 0, 0),
    emissiveIntensity: opts.emissiveIntensity ?? 0
  })
}

/** Helper: small RNG so layouts are deterministic across reloads. */
export function rng(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
