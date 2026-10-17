import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
} from '@react-three/drei';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
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
  const feather = kind === 'soft' ? 0.42 : kind === 'window' ? 0.08 : 0.3;
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const u = Math.abs((i + 0.5) / size - 0.5) * 2,
        v = Math.abs((j + 0.5) / size - 0.5) * 2;
      const edge = (t: number) => {
        const x = Math.min(1, Math.max(0, (1 - t) / feather));
        return x * x * (3 - 2 * x);
      };
      // Soft boxes are brighter toward one end, like a real diffuser with an offset lamp.
      const gradient = kind === 'strip' ? 1 : 0.7 + 0.3 * ((j + 0.5) / size);
      // Windows: 3 × 2 panes separated by dark mullions. The mullion edges are smoothstepped
      // over a few texels: hard edges stair-step once a concave fillet magnifies the cube map.
      const fx = (i + 0.5) / size,
        fy = (j + 0.5) / size;
      const bar = (t: number, panes: number, half: number) => {
        const d = Math.abs(((t * panes) % 1) - 0.5);
        const x = Math.min(1, Math.max(0, (d - half + 0.04) / 0.08));
        return x * x * (3 - 2 * x);
      };
      const glass = kind === 'window' ? (1 - bar(fx, 3, 0.44)) * (1 - bar(fy, 2, 0.45)) : 1;
      const value = Math.round(255 * edge(u) * edge(v) * gradient * glass);
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
        // Parts cast shadows onto the room but do not receive them: on near-mirror metal the
        // key light's direct term is a tiny specular, and self-shadowing only adds faceted
        // shadow-terminator artifacts that follow the tessellation.
        <mesh key={part.name} geometry={geometry} castShadow name={part.name}>
          <meshStandardMaterial
            {...(concept.materials?.[part.material] ?? MATERIALS[part.material])}
            metalness={1}
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

/** A dark gallery: polished floor, a back wall and a left wall, each with a full-height light
 * slot, and a right wall closing the corner. Each slot is a real rect-area light and also a
 * strip card in the reflection rig, so reflections and room agree. The back slot backlights
 * the frontal view; the side slot sits in the hero frame's left third. */
const SLOT = { width: 0.36, height: 7.2 };
// The right wall stands far out (x = 18) so portrait frames, which dolly the hero camera
// back by up to ~2.5×, stay inside the room instead of looking through the wall.
export const GALLERY = { backZ: -5.8, leftX: -7, rightX: 18, backSlotX: 0.8, sideSlotZ: 0 };
RectAreaLightUniformsLib.init();

/** A wall along its own local x axis (length `span` around `centre`), with a slot at `slotAt`. */
function SlottedWall({
  span,
  slotAt,
  position,
  rotationY,
}: {
  span: readonly [number, number];
  slotAt: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const wall = { color: '#34322f', roughness: 0.88, metalness: 0, envMapIntensity: 0.25 };
  const left = slotAt - SLOT.width / 2,
    right = slotAt + SLOT.width / 2;
  const glow = useMemo(() => new Color('#fff1dc').multiplyScalar(3), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[(span[0] + left) / 2, 5, 0]} receiveShadow>
        <boxGeometry args={[left - span[0], 10, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[(right + span[1]) / 2, 5, 0]} receiveShadow>
        <boxGeometry args={[span[1] - right, 10, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[slotAt, (SLOT.height + 10) / 2, 0]}>
        <boxGeometry args={[SLOT.width, 10 - SLOT.height, 0.3]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      {/* The glowing slot itself, recessed behind the wall face. */}
      <mesh position={[slotAt, SLOT.height / 2, -0.2]}>
        <planeGeometry args={[SLOT.width, SLOT.height]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      {/* Rect area lights emit along their local -z; turn it to face into the room (+z). */}
      <rectAreaLight
        position={[slotAt, SLOT.height / 2, 0.16]}
        rotation={[0, Math.PI, 0]}
        width={SLOT.width}
        height={SLOT.height}
        intensity={14}
        color="#fff1dc"
      />
    </group>
  );
}

function GalleryStage({ fidelity }: { fidelity: Fidelity }) {
  const plain = { color: '#34322f', roughness: 0.88, metalness: 0, envMapIntensity: 0.25 };
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          resolution={fidelity === 'high' ? 1024 : 512}
          blur={[320, 90]}
          mixBlur={1}
          mixStrength={1.6}
          mixContrast={1}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.3}
          roughness={0.82}
          metalness={0.35}
          color="#1b1a19"
          mirror={0}
        />
      </mesh>
      <SlottedWall
        span={[GALLERY.leftX, GALLERY.rightX]}
        slotAt={GALLERY.backSlotX}
        position={[0, 0, GALLERY.backZ]}
        rotationY={0}
      />
      {/* Left wall: local x runs along world -z (front at -6, back wall at +5.65); its face
          (local +z) looks toward +x, into the room. */}
      <SlottedWall
        span={[-6, -GALLERY.backZ - 0.15]}
        slotAt={-GALLERY.sideSlotZ}
        position={[GALLERY.leftX, 0, 0]}
        rotationY={Math.PI / 2}
      />
      <mesh position={[GALLERY.rightX, 5, 3]} receiveShadow>
        <boxGeometry args={[0.3, 10, 17.6]} />
        <meshStandardMaterial {...plain} />
      </mesh>
    </group>
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
    const preset = frameView(concept.views[view] ?? concept.views.hero, size.width / size.height);
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
      {showEnvironment ? null : concept.stage === 'gallery' ? (
        <GalleryStage fidelity={fidelity} />
      ) : (
        <Backdrop />
      )}
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
