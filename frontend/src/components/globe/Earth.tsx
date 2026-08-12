import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3 } from '../../lib/utils'

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
/*  Atmosphere — layered additive fresnel halo (cyan core, violet     */
/*  outer bloom) on backside spheres, purely decorative               */
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
  uniform float uPower;
  uniform float uBias;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(uBias - dot(vNormal, vec3(0.0, 0.0, 1.0)), uPower);
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`

function AtmosphereLayer({ scale, color, power, bias }: { scale: number; color: string; power: number; bias: number }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uBias: { value: bias } }),
    [color, power, bias],
  )
  return (
    <mesh scale={scale}>
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

function Atmosphere() {
  return (
    <>
      <AtmosphereLayer scale={1.18} color="#38bdf8" power={2.4} bias={0.62} />
      {/* wider, softer violet halo bleeding further out for extra depth */}
      <AtmosphereLayer scale={1.34} color="#a78bfa" power={3.1} bias={0.66} />
    </>
  )
}

/* ================================================================== */
/*  Orbit ring — a sparse belt of twinkling, multi-colored dust        */
/*  slowly circling the globe. Purely decorative, no data behind it.  */
/* ================================================================== */

const RING_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24']

const ringDotsVertex = /* glsl */ `
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uSize;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = 0.5 + 0.5 * sin(uTime * 1.1 + aSeed * 6.2831);
    gl_PointSize = uSize * (0.6 + tw) * (11.0 / -mv.z);
    vAlpha = tw;
    vColor = aColor;
    gl_Position = projectionMatrix * mv;
  }
`

const ringDotsFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, a * (0.35 + vAlpha * 0.55));
  }
`

function OrbitRing() {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, seeds, colors } = useMemo(() => {
    const count = 220
    const innerR = GLOBE_RADIUS * 2.15
    const outerR = GLOBE_RADIUS * 2.55
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = innerR + Math.random() * (outerR - innerR)
      const height = (Math.random() - 0.5) * 0.22
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
      seeds[i] = Math.random()
      const c = new THREE.Color(RING_COLORS[i % RING_COLORS.length])
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, seeds, colors }
  }, [])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: 1.6 } }), [])

  useFrame(({ clock, gl }, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime
      matRef.current.uniforms.uSize.value = 1.6 * gl.getPixelRatio()
    }
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.035
  })

  return (
    <group ref={groupRef} rotation={[THREE.MathUtils.degToRad(21), 0, THREE.MathUtils.degToRad(-6)]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={ringDotsVertex}
          fragmentShader={ringDotsFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

/* ================================================================== */
/*  Earth — the full assembly                                          */
/* ================================================================== */

export function Earth({ dotDensity = 1 }: { dotDensity?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef}>
      <GlobeBody />
      <LandDots density={dotDensity} />
      <Atmosphere />
      <OrbitRing />
    </group>
  )
}
