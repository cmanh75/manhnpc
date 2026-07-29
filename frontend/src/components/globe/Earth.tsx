import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { VisitedPlace } from '../../lib/types'
import { latLngToVector3 } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

export const GLOBE_RADIUS = 2

/* ================================================================== */
/*  Land dots — one THREE.Points, one draw call, ~9k twinkling dots   */
/* ================================================================== */

let dotsCache: number[] | null = null

function useLandDots() {
  const [dots, setDots] = useState<number[] | null>(dotsCache)
  useEffect(() => {
    if (dotsCache) return
    let alive = true
    fetch('/land-dots.json')
      .then((r) => r.json())
      .then((data: number[]) => {
        dotsCache = data
        if (alive) setDots(data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return dots
}

const dotsVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  varying float vAlpha;
  varying float vLat;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.72 + 0.28 * sin(uTime * 1.4 + aSeed * 6.2831);
    gl_PointSize = uSize * tw * (11.0 / -mv.z);
    vAlpha = tw;
    vLat = position.y / ${GLOBE_RADIUS.toFixed(1)};
    gl_Position = projectionMatrix * mv;
  }
`

const dotsFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vLat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    vec3 color = mix(uColorA, uColorB, smoothstep(-1.0, 1.0, vLat));
    gl_FragColor = vec4(color, a * 0.85);
  }
`

function LandDots({ density = 1 }: { density?: number }) {
  const dots = useLandDots()
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, seeds } = useMemo(() => {
    if (!dots) return { positions: new Float32Array(0), seeds: new Float32Array(0) }
    const sourceCount = dots.length / 2
    const step = Math.max(1, Math.round(1 / density))
    const count = Math.ceil(sourceCount / step)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const sourceIndex = Math.min(i * step, sourceCount - 1)
      const [x, y, z] = latLngToVector3(dots[sourceIndex * 2], dots[sourceIndex * 2 + 1], GLOBE_RADIUS * 1.004)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      seeds[i] = (i * 0.618033) % 1
    }
    return { positions, seeds }
  }, [dots, density])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 1.35 },
      uColorA: { value: new THREE.Color('#1cb8d9') },
      uColorB: { value: new THREE.Color('#7dd3fc') },
    }),
    [],
  )

  useFrame(({ clock, gl }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.elapsedTime
    // gl_PointSize is in physical pixels — compensate for devicePixelRatio
    matRef.current.uniforms.uSize.value = 1.5 * gl.getPixelRatio()
  })

  if (!dots) return null

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={dotsVertex}
        fragmentShader={dotsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

/* ================================================================== */
/*  Globe body — deep navy sphere with a cyan fresnel rim             */
/* ================================================================== */

const globeVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const globeFragment = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 3.2);
    vec3 color = uBase + uRim * fresnel * 0.9;
    gl_FragColor = vec4(color, 1.0);
  }
`

function GlobeBody() {
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color('#0a0f28') },
      uRim: { value: new THREE.Color('#22d3ee') },
    }),
    [],
  )
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial vertexShader={globeVertex} fragmentShader={globeFragment} uniforms={uniforms} />
    </mesh>
  )
}

/* ================================================================== */
/*  Atmosphere — additive fresnel halo on a backside sphere           */
/* ================================================================== */

const atmoVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmoFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`

function Atmosphere() {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#38bdf8') } }), [])
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
      <shaderMaterial
        vertexShader={atmoVertex}
        fragmentShader={atmoFragment}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* ================================================================== */
/*  Markers — pulsing ring + light pillar + glowing core per place    */
/* ================================================================== */

const ringVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    // expanding sonar ring
    float r = fract(uTime * 0.45 + uSeed);
    float ring = smoothstep(r - 0.09, r, d) * (1.0 - smoothstep(r, r + 0.05, d));
    float fade = 1.0 - r;
    // solid glowing core
    float core = smoothstep(0.22, 0.05, d);
    float a = ring * fade * 0.9 + core;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

const pillarVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const pillarFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    float pulse = 0.75 + 0.25 * sin(uTime * 2.2 + uSeed * 6.2831);
    float a = pow(1.0 - vUv.y, 2.2) * 0.75 * pulse;
    gl_FragColor = vec4(uColor, a);
  }
`

interface MarkerProps {
  place: VisitedPlace
  index: number
  selected: boolean
  onSelect: (p: VisitedPlace) => void
}

function Marker({ place, index, selected, onSelect }: MarkerProps) {
  const [hovered, setHovered] = useState(false)
  const ringMat = useRef<THREE.ShaderMaterial>(null)
  const pillarMat = useRef<THREE.ShaderMaterial>(null)

  const position = useMemo(
    () => new THREE.Vector3(...latLngToVector3(place.lat, place.lng, GLOBE_RADIUS * 1.008)),
    [place.lat, place.lng],
  )

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize())
    return q
  }, [position])

  const ringUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: (index * 0.37) % 1 },
      uColor: { value: new THREE.Color(place.color) },
    }),
    [index, place.color],
  )

  const pillarUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: (index * 0.37) % 1 },
      uColor: { value: new THREE.Color(place.color) },
    }),
    [index, place.color],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ringMat.current) ringMat.current.uniforms.uTime.value = t
    if (pillarMat.current) pillarMat.current.uniforms.uTime.value = t
  })

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  const scale = selected ? 1.5 : hovered ? 1.25 : 1

  return (
    <group position={position} quaternion={quaternion}>
      {/* sonar ring + core, facing outward */}
      <mesh scale={scale}>
        <planeGeometry args={[0.22, 0.22]} />
        <shaderMaterial
          ref={ringMat}
          vertexShader={ringVertex}
          fragmentShader={ringFragment}
          uniforms={ringUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* light pillar rising from the surface */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, -0.11, 0]} scale={[1, selected ? 1.7 : 1, 1]}>
          <cylinderGeometry args={[0.008, 0.016, 0.22, 8, 1, true]} />
          <shaderMaterial
            ref={pillarMat}
            vertexShader={pillarVertex}
            fragmentShader={pillarFragment}
            uniforms={pillarUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* invisible, generous hit target */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(place)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {(hovered || selected) && (
        <Html center distanceFactor={5.5} position={[0, 0.16, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#e8ecf8',
              background: 'rgba(8, 10, 26, 0.82)',
              border: `1px solid ${place.color}66`,
              boxShadow: `0 0 18px -2px ${place.color}55`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: place.color }}>●</span> {place.name}
          </div>
        </Html>
      )}
    </group>
  )
}

/* ================================================================== */
/*  Journey arcs — bezier ribbons + a comet tracing each hop          */
/* ================================================================== */

function buildArc(from: THREE.Vector3, to: THREE.Vector3): THREE.CubicBezierCurve3 {
  const dist = from.distanceTo(to)
  const lift = 1 + THREE.MathUtils.clamp(dist * 0.16, 0.08, 0.55)
  const c1 = from.clone().lerp(to, 0.32).normalize().multiplyScalar(GLOBE_RADIUS * lift)
  const c2 = from.clone().lerp(to, 0.68).normalize().multiplyScalar(GLOBE_RADIUS * lift)
  return new THREE.CubicBezierCurve3(from, c1, c2, to)
}

function Comet({ curve, color, offset }: { curve: THREE.CubicBezierCurve3; color: string; offset: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.elapsedTime * 0.08 + offset) % 1
    curve.getPoint(t, ref.current.position)
    const s = 0.6 + 0.4 * Math.sin(t * Math.PI)
    ref.current.scale.setScalar(s)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

function Arcs({ places }: { places: VisitedPlace[] }) {
  const arcs = useMemo(() => {
    const sorted = [...places].sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
    const result: { curve: THREE.CubicBezierCurve3; points: THREE.Vector3[]; colorA: string; colorB: string }[] = []
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = new THREE.Vector3(...latLngToVector3(sorted[i].lat, sorted[i].lng, GLOBE_RADIUS * 1.01))
      const to = new THREE.Vector3(...latLngToVector3(sorted[i + 1].lat, sorted[i + 1].lng, GLOBE_RADIUS * 1.01))
      const curve = buildArc(from, to)
      result.push({ curve, points: curve.getPoints(48), colorA: sorted[i].color, colorB: sorted[i + 1].color })
    }
    return result
  }, [places])

  return (
    <group>
      {arcs.map((arc, i) => (
        <group key={i}>
          <Line
            points={arc.points}
            vertexColors={arc.points.map((_, j) => {
              const c = new THREE.Color(arc.colorA).lerp(new THREE.Color(arc.colorB), j / (arc.points.length - 1))
              return [c.r, c.g, c.b] as [number, number, number]
            })}
            lineWidth={1.1}
            transparent
            opacity={0.38}
          />
          <Comet curve={arc.curve} color={arc.colorB} offset={i * 0.145} />
        </group>
      ))}
    </group>
  )
}

/* ================================================================== */
/*  Earth — the full assembly                                          */
/* ================================================================== */

export function Earth({ places, dotDensity = 1 }: { places: VisitedPlace[]; dotDensity?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  return (
    <group ref={groupRef}>
      <GlobeBody />
      <LandDots density={dotDensity} />
      <Atmosphere />
      <Arcs places={places} />
      {places.map((place, i) => (
        <Marker
          key={place.id}
          place={place}
          index={i}
          selected={selectedPlace?.id === place.id}
          onSelect={(p) => setSelectedPlace(selectedPlace?.id === p.id ? null : p)}
        />
      ))}
    </group>
  )
}
