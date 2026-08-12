import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Earth, GLOBE_RADIUS } from './Earth'

/** Pause auto-rotation while the user drags, resume a moment after they let go. */
function AutoRotateManager({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = () => {
      controls.autoRotate = false
      if (timer) clearTimeout(timer)
    }
    const scheduleResume = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        controls.autoRotate = true
      }, 4000)
    }
    controls.addEventListener('start', stop)
    controls.addEventListener('end', scheduleResume)
    return () => {
      controls.removeEventListener('start', stop)
      controls.removeEventListener('end', scheduleResume)
      if (timer) clearTimeout(timer)
    }
  }, [controlsRef])

  return null
}

interface GlobeSceneProps {
  className?: string
  /** softer settings for the hero embed */
  ambient?: boolean
}

export function GlobeScene({ className, ambient = false }: GlobeSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div className={className}>
      <Canvas
        dpr={mobile ? [1, 1.25] : [1, 2]}
        camera={{ position: [0, 0.9, 5.4], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Stars radius={90} depth={50} count={mobile ? 1200 : ambient ? 2400 : 4200} factor={3.6} saturation={0} fade speed={0.5} />
          <Earth dotDensity={mobile ? (ambient ? 0.4 : 0.65) : 1} />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.55}
            autoRotate
            autoRotateSpeed={ambient ? 0.7 : 0.5}
            minDistance={GLOBE_RADIUS * 1.45}
            maxDistance={GLOBE_RADIUS * 4.4}
            zoomSpeed={0.7}
          />
          <AutoRotateManager controlsRef={controlsRef} />
          {!(mobile && ambient) && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={ambient ? 0.55 : 0.8} luminanceThreshold={0.18} mipmapBlur radius={0.72} />
              <Vignette eskil={false} offset={0.12} darkness={0.72} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
