import { EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { SHOWROOM_WEATHER_PRESET } from '../scene/showroomContract'

/**
 * Post-processing pipeline (safe-only).
 *
 * Removed and never re-add unless you also fix the underlying issue:
 *  - SSAO: triggers `GL_INVALID_OPERATION: glBlitFramebuffer ... depth stencil
 *    attachments cannot be the same image` on this GPU/driver.
 *  - Bloom: causes half-frame black flicker on camera rotation. Bloom needs to
 *    read the framebuffer it just wrote to (for downsampling/upsampling), and
 *    that read/write race surfaces as a flicker on some hardware regardless of
 *    `mipmapBlur` or `multisampling` settings.
 *
 * Replacements for the look they provided:
 *  - SSAO -> BaseShadowDisc + dark base outline under every prop (in CityScene)
 *  - Bloom glow -> high emissive intensity on lights / status rings / scan beam
 *
 * Kept: ToneMapping (ACES filmic) — pure per-pixel op, no FBO race.
 *        Vignette — pure per-pixel op, no FBO race.
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        eskil={false}
        offset={SHOWROOM_WEATHER_PRESET.vignette.offset}
        darkness={SHOWROOM_WEATHER_PRESET.vignette.darkness}
      />
    </EffectComposer>
  )
}
