import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Earth, GLOBE_RADIUS } from './Earth'
import type { VisitedPlace } from '../../lib/types'
import { latLngToVector3 } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

/**
 * Camera rig: when a place is selected, glide the camera around the
 * globe until the place faces the viewer. User interaction cancels it.
 */
function CameraRig({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const targetDir = useRef<THREE.Vector3 | null>(null)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (selectedPlace) {
      targetDir.current = new THREE.Vector3(
        ...latLngToVector3(selectedPlace.lat, selectedPlace.lng, 1),
      ).normalize()
    } else {
      targetDir.current = null
    }
  }, [selectedPlace])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const cancel = () => {
      targetDir.current = null
    }
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controlsRef])

  useFrame(() => {
    const dir = targetDir.current
    if (!dir) return
    const dist = camera.position.length()
    tmp.copy(camera.position).normalize().lerp(dir, 0.065).normalize()
    if (tmp.dot(dir) > 0.99995) targetDir.current = null
    camera.position.copy(tmp.multiplyScalar(dist))
    camera.lookAt(0, 0, 0)
  })

  return null
}

/** Pause auto-rotation while the user interacts or a place is open. */
function AutoRotateManager({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const selectedPlace = useAppStore((s) => s.selectedPlace)

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
        if (!useAppStore.getState().selectedPlace) controls.autoRotate = true
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

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    if (selectedPlace) controls.autoRotate = false
    else {
      const timer = setTimeout(() => {
        controls.autoRotate = true
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [selectedPlace, controlsRef])

  return null
}

interface GlobeSceneProps {
  places: VisitedPlace[]
  className?: string
  /** softer settings for the hero embed */
  ambient?: boolean
}

export function GlobeScene({ places, className, ambient = false }: GlobeSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.9, 5.4], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Stars radius={90} depth={50} count={ambient ? 2400 : 4200} factor={3.6} saturation={0} fade speed={0.5} />
          <Earth places={places} />
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
          <CameraRig controlsRef={controlsRef} />
          <AutoRotateManager controlsRef={controlsRef} />
          <EffectComposer multisampling={0}>
            <Bloom intensity={ambient ? 0.55 : 0.8} luminanceThreshold={0.18} mipmapBlur radius={0.72} />
            <Vignette eskil={false} offset={0.12} darkness={0.72} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
