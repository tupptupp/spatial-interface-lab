import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  Mesh,
  PCFSoftShadowMap,
  RGBAFormat,
  SpotLight,
  UnsignedByteType,
  Vector3,
} from 'three';
import type { PerspectiveCamera } from 'three';

type Controls = { target: Vector3; update: () => void };
import { cyclorama } from '../sculpture/cyclorama';
import { frameView } from '../sculpture/framing';
import type { MeshData } from '../sculpture/surfaceNets';
import type {
  Card,
  ConceptDefinition,
  Fidelity,
  LightRig,
  MaterialKey,
  ViewId,
} from '../sculpture/types';

export type StudioDiagnostics = {
  triangles: number;
  calls: number;
  buildMs: number;
  environment: number;
  dpr: number;
  renderer: string;
};

const ENVIRONMENT = { high: 512, balanced: 256 } as const;

/** Physically motivated metal tints (linear F0 of chromium ≈ 0.55; polished steel slightly warmer). */
const MATERIALS: Record<MaterialKey, { color: string; roughness: number }> = {
  chrome: { color: '#c9cbcc', roughness: 0.035 },
  satin: { color: '#b8b6b2', roughness: 0.22 },
  smoked: { color: '#3d4043', roughness: 0.04 },
};

function toGeometry(data: MeshData) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(data.normals, 3));
  geometry.setIndex(new BufferAttribute(data.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Feathered card textures: highlights fall off like a diffused softbox, not a hard quad. */
function cardTexture(kind: Card['kind']) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const feather = kind === 'soft' ? 0.42 : 0.18;
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const u = Math.abs((i + 0.5) / size - 0.5) * 2,
        v = Math.abs((j + 0.5) / size - 0.5) * 2;
      const edge = (t: number) => {
        const x = Math.min(1, Math.max(0, (1 - t) / feather));
        return x * x * (3 - 2 * x);
      };
      // Soft boxes are brighter toward one end, like a real diffuser with an offset lamp.
      const gradient = kind === 'soft' ? 0.7 + 0.3 * ((j + 0.5) / size) : 1;
      const value = Math.round(255 * edge(u) * edge(v) * gradient);
      data.set([value, value, value, 255], (j * size + i) * 4);
    }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function ReflectionCard({ card, centre }: { card: Card; centre: readonly number[] }) {
  const ref = useRef<Mesh>(null);
  const map = useMemo(() => cardTexture(card.kind), [card.kind]);
  const color = useMemo(() => new Color(card.color).multiplyScalar(card.intensity), [card]);
  useEffect(() => () => map.dispose(), [map]);
  useLayoutEffect(() => {
    ref.current?.lookAt(new Vector3(...(card.aim ?? centre)));
  }, [card, centre]);
  return (
    <mesh ref={ref} position={card.position as [number, number, number]}>
      <planeGeometry args={[card.size[0], card.size[1]]} />
      <meshBasicMaterial
        map={map}
        color={color}
        toneMapped={false}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

const domeVertex = /* glsl */ `
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const domeFragment = /* glsl */ `
uniform vec3 top;
uniform vec3 horizon;
uniform vec3 bottom;
varying vec3 vDirection;
void main() {
  float y = normalize(vDirection).y;
  vec3 color = y > 0.0 ? mix(horizon, top, pow(y, 0.7)) : mix(horizon, bottom, pow(-y, 0.4));
  gl_FragColor = vec4(color, 1.0);
}`;

function ReflectionEnvironment({
  rig,
  centre,
  resolution,
  background,
}: {
  rig: LightRig;
  centre: readonly number[];
  resolution: number;
  background: boolean;
}) {
  const uniforms = useMemo(
    () => ({
      top: { value: new Color(rig.dome.top) },
      horizon: { value: new Color(rig.dome.horizon) },
      bottom: { value: new Color(rig.dome.bottom) },
    }),
    [rig],
  );
  return (
    <Environment
      resolution={resolution}
      frames={1}
      background={background}
      key={`${rig.id}-${resolution}-${centre.join()}-${background}`}
    >
      <mesh scale={60}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          side={BackSide}
          uniforms={uniforms}
          vertexShader={domeVertex}
          fragmentShader={domeFragment}
        />
      </mesh>
      {rig.cards.map((card, index) => (
        <ReflectionCard key={index} card={card} centre={centre} />
      ))}
    </Environment>
  );
}

function SculptureParts({
  concept,
  fidelity,
  onBuilt,
}: {
  concept: ConceptDefinition;
  fidelity: Fidelity;
  onBuilt: (ms: number) => void;
}) {
  const built = useMemo(() => {
    const start = performance.now();
    const parts = concept.parts.map((part) => ({
      part,
      geometry: toGeometry(part.build(fidelity)),
    }));
    return { parts, ms: performance.now() - start };
  }, [concept, fidelity]);
  useEffect(() => {
    onBuilt(built.ms);
    return () => built.parts.forEach(({ geometry }) => geometry.dispose());
  }, [built, onBuilt]);
  return (
    <group>
      {built.parts.map(({ part, geometry }) => (
        <mesh key={part.name} geometry={geometry} castShadow receiveShadow name={part.name}>
          <meshStandardMaterial
            color={MATERIALS[part.material].color}
            metalness={1}
            roughness={MATERIALS[part.material].roughness}
          />
        </mesh>
      ))}
    </group>
  );
}

function Backdrop() {
  const geometry = useMemo(() => toGeometry(cyclorama()), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#4a4744" roughness={0.7} metalness={0} envMapIntensity={0.1} />
    </mesh>
  );
}

function KeyLight({ rig, centre }: { rig: LightRig; centre: readonly number[] }) {
  const ref = useRef<SpotLight>(null);
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.target.position.set(centre[0]!, 0, centre[2]! - 0.6);
    light.target.updateMatrixWorld();
  }, [centre, rig]);
  return (
    <spotLight
      ref={ref}
      position={rig.key.position as [number, number, number]}
      intensity={rig.key.intensity}
      angle={rig.key.angle}
      penumbra={0.85}
      decay={2}
      color="#fff4e8"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.02}
      shadow-radius={6}
    />
  );
}

function CameraRig({
  concept,
  view,
  resetToken,
}: {
  concept: ConceptDefinition;
  view: ViewId;
  resetToken: number;
}) {
  const { camera, size, invalidate } = useThree();
  const controls = useThree((state) => state.controls) as Controls | null;
  useLayoutEffect(() => {
    const preset = frameView(concept.views[view], size.width / size.height);
    const perspective = camera as PerspectiveCamera;
    perspective.position.set(...preset.position);
    perspective.fov = preset.fov;
    perspective.near = 0.05;
    perspective.far = 120;
    perspective.updateProjectionMatrix();
    perspective.lookAt(...preset.target);
    if (controls) {
      controls.target.set(...preset.target);
      controls.update();
    }
    invalidate();
  }, [camera, concept, controls, invalidate, resetToken, size.height, size.width, view]);
  return null;
}

/** Signals capture tooling once a state has been drawn at least twice after a change. */
function FrameProbe({
  stateKey,
  onDiagnostics,
  buildMs,
  resolution,
}: {
  stateKey: string;
  onDiagnostics: (d: StudioDiagnostics) => void;
  buildMs: number;
  resolution: number;
}) {
  const { gl, invalidate } = useThree();
  const frames = useRef(0);
  useEffect(() => {
    frames.current = 0;
    delete document.documentElement.dataset.frame;
    invalidate();
  }, [stateKey, invalidate]);
  useFrame(() => {
    frames.current++;
    if (frames.current < 3) invalidate();
    else if (frames.current === 3) {
      requestAnimationFrame(() => {
        document.documentElement.dataset.frame = stateKey;
        const context = gl.getContext();
        const debug = context.getExtension('WEBGL_debug_renderer_info');
        onDiagnostics({
          triangles: gl.info.render.triangles,
          calls: gl.info.render.calls,
          buildMs,
          environment: resolution,
          dpr: gl.getPixelRatio(),
          renderer: String(
            context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER),
          ),
        });
      });
    }
  });
  return null;
}

export type StudioProps = {
  concept: ConceptDefinition;
  view: ViewId;
  rig: LightRig;
  fidelity: Fidelity;
  resetToken: number;
  onDiagnostics: (d: StudioDiagnostics) => void;
  onBuilt: (ms: number) => void;
  buildMs: number;
  /** Diagnostic: show the baked reflection environment instead of the visible studio. */
  showEnvironment: boolean;
};

export default function Studio({
  concept,
  view,
  rig,
  fidelity,
  resetToken,
  onDiagnostics,
  onBuilt,
  buildMs,
  showEnvironment,
}: StudioProps) {
  const resolution = ENVIRONMENT[fidelity];
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, fidelity === 'high' ? 2 : 1.25]}
      shadows={{ type: PCFSoftShadowMap }}
      camera={{ fov: 27, near: 0.05, far: 120, position: [0, 1.5, 8] }}
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: rig.exposure,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={['#070707']} />
      <fog attach="fog" args={['#070707', 12, 30]} />
      <ReflectionEnvironment
        rig={rig}
        centre={concept.centre}
        resolution={resolution}
        background={showEnvironment}
      />
      <KeyLight rig={rig} centre={concept.centre} />
      <SculptureParts concept={concept} fidelity={fidelity} onBuilt={onBuilt} />
      {showEnvironment ? null : <Backdrop />}
      <ContactShadows
        key={concept.id}
        position={[0, 0.002, 0]}
        scale={7}
        resolution={1024}
        far={1.4}
        blur={2.4}
        opacity={0.75}
        frames={1}
        color="#000000"
      />
      <OrbitControls
        makeDefault
        enableDamping={false}
        minDistance={1}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.495}
      />
      <CameraRig concept={concept} view={view} resetToken={resetToken} />
      <FrameProbe
        stateKey={`${concept.id}:${view}:${rig.id}:${fidelity}:${resetToken}:${showEnvironment}`}
        onDiagnostics={onDiagnostics}
        buildMs={buildMs}
        resolution={resolution}
      />
    </Canvas>
  );
}
