import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { ACESFilmicToneMapping, BackSide, Group, MathUtils, Vector3 } from 'three';
import { sampleShot, smooth } from '../animation/choreography';
import type { LabValues } from '../interaction/lab';
import { observeFrame, QUALITY } from '../performance/quality';
import type { Quality, QualityState } from '../performance/quality';
import { createBlade } from './sculptureGeometry';
import { GpuFrameGate } from '../performance/GpuFrameGate';

export type RenderEvidence = {
  quality: Quality;
  width: number;
  height: number;
  dpr: number;
  calls: number;
  triangles: number;
  frames: number[];
  renderer: string;
  readyMs: number;
  progress: number;
  camera: number[];
};
declare global {
  interface Window {
    __SPATIAL_LAB__?: RenderEvidence;
  }
}
type Props = {
  progress: { current: number };
  lab: LabValues;
  onReady: () => void;
  onFailure: () => void;
  onQuality: (quality: Quality) => void;
};

function Sculpture({
  segments,
  roughness,
  groupRef,
}: {
  segments: number;
  roughness: number;
  groupRef: React.RefObject<Group | null>;
}) {
  const geometry = useMemo(() => createBlade(segments), [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          geometry={geometry}
          rotation={[index * 0.92, index * 2.094, index * 0.28]}
        >
          <meshStandardMaterial
            color="#c4c9c7"
            metalness={1}
            roughness={roughness}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.08, 0]} rotation={[0.3, 0.2, Math.PI / 4]}>
        <octahedronGeometry args={[0.51, 0]} />
        <meshPhysicalMaterial
          color="#b5d8c9"
          metalness={0}
          roughness={0.07}
          transmission={0.92}
          thickness={0.7}
          ior={1.48}
          attenuationColor="#708d7c"
          attenuationDistance={1.8}
          envMapIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

function World({ progress, lab, onReady, onFailure, onQuality }: Props) {
  const { gl, scene, camera, size, invalidate, setDpr } = useThree();
  const gate = useMemo(() => new GpuFrameGate(gl.getContext() as WebGL2RenderingContext), [gl]);
  useEffect(() => () => gate.dispose(), [gate]);
  const sculpture = useRef<Group>(null);
  const [quality, setQuality] = useState<Quality>('high');
  const qualityState = useRef<QualityState>({ quality: 'high', slowWindows: 0, samples: [] });
  const ready = useRef(false);
  const previousCompletion = useRef(0);
  const submitted = useRef<{ progress: number; camera: number[]; signature: string } | null>(null);
  const lastSignature = useRef('');
  const lastInput = useRef(0);

  const introStart = useRef<number | null>(null);
  const look = useMemo(() => new Vector3(), []);
  const config = QUALITY[quality];

  useEffect(() => {
    gl.transmissionResolutionScale = quality === 'high' ? 0.5 : 0.35;
    setDpr(Math.min(window.devicePixelRatio || 1, config.dpr));
    onQuality(quality);
  }, [config.dpr, gl, onQuality, quality, setDpr]);

  useEffect(() => {
    const wake = () => {
      if (!document.hidden) {
        lastInput.current = performance.now();
        invalidate();
      }
    };
    const visibility = () => {
      previousCompletion.current = 0;
      if (!document.hidden) invalidate();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    const canvas = gl.domElement;
    window.addEventListener('scroll', wake, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      window.removeEventListener('scroll', wake);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, invalidate, onFailure]);

  useFrame(() => {
    const now = performance.now();
    const completion = gate.poll(now);
    if (completion.state === 'pending') {
      invalidate();
      return;
    }
    if (completion.state === 'failed') {
      onFailure();
      return;
    }
    if (completion.state === 'complete') {
      const evidence = window.__SPATIAL_LAB__;
      if (evidence && submitted.current) {
        evidence.calls = gl.info.render.calls;
        evidence.triangles = gl.info.render.triangles;
        evidence.width = gl.domElement.width;
        evidence.height = gl.domElement.height;
        evidence.dpr = gl.getPixelRatio();
        evidence.quality = quality;
        evidence.progress = submitted.current.progress;
        evidence.camera = submitted.current.camera;
        const interval = now - previousCompletion.current;
        if (previousCompletion.current && now - lastInput.current < 1000 && interval <= 1000) {
          if (evidence.frames.length < 2400) evidence.frames.push(interval);
          const next = observeFrame(qualityState.current, interval);
          qualityState.current = next;
          if (next.quality !== quality) setQuality(next.quality);
        }
      }
      previousCompletion.current = now;
      if (!ready.current) {
        ready.current = true;
        introStart.current = now;
        window.__SPATIAL_LAB__ = {
          quality,
          width: gl.domElement.width,
          height: gl.domElement.height,
          dpr: gl.getPixelRatio(),
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          frames: [],
          renderer: gl.getContext().getParameter(gl.getContext().RENDERER) as string,
          readyMs: now,
          progress: submitted.current?.progress ?? progress.current,
          camera: submitted.current?.camera ?? camera.position.toArray(),
        };
        onReady();
      }
    }
    if (document.hidden) return;
    const portrait = size.width / size.height < 1.05;
    const shot = sampleShot(progress.current, portrait);
    const reveal = introStart.current === null ? 0 : smooth((now - introStart.current) / 1100);
    const signature = [
      progress.current,
      lab.roughness,
      lab.rotation,
      lab.light,
      size.width,
      size.height,
      gl.domElement.width,
      gl.domElement.height,
      quality,
      reveal,
    ].join('|');
    if (signature === lastSignature.current) {
      if (reveal < 1) invalidate();
      return;
    }
    camera.position.set(...shot.position);
    look.set(
      shot.target[0] - (portrait ? 0 : 1.05),
      shot.target[1] + (portrait ? 1.1 : 0),
      shot.target[2],
    );
    camera.lookAt(look);
    gl.toneMappingExposure = shot.exposure * (0.55 + reveal * 0.45);
    if (sculpture.current) {
      sculpture.current.rotation.set(...shot.rotation);
      sculpture.current.rotation.y += MathUtils.degToRad(lab.rotation);
    }
    gl.render(scene, camera);
    lastSignature.current = signature;
    submitted.current = {
      progress: progress.current,
      camera: camera.position.toArray(),
      signature,
    };
    if (!gate.submit(performance.now())) {
      onFailure();
      return;
    }
    invalidate(); // Poll until completion, then sleep unless the pose or material changed.
  }, 1); // Own the single main render pass so a GPU fence follows the actual draw.

  return (
    <>
      <color attach="background" args={['#101210']} />
      <fog attach="fog" args={['#101210', 12, 30]} />
      <Environment resolution={config.environment} frames={1}>
        <mesh>
          <sphereGeometry args={[30, 16, 8]} />
          <meshBasicMaterial color="#18211b" side={BackSide} />
        </mesh>
        <Lightformer
          form="rect"
          intensity={7}
          color="#fff6e6"
          position={[0, 5, -3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[7, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={5}
          color="#dbe8e7"
          position={[-5, 0, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[2, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={9}
          color="#f7f6ef"
          position={[4, 1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.4, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[0, -4, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[5, 2, 1]}
        />
      </Environment>
      <ambientLight intensity={0.15} />
      <spotLight
        position={[Math.sin(MathUtils.degToRad(lab.light)) * 7, 7, 4]}
        intensity={140}
        angle={0.5}
        penumbra={0.8}
        color="#f0eddf"
      />
      <Sculpture segments={config.segments} roughness={lab.roughness} groupRef={sculpture} />
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[2.3, 2.3, 0.18, 96]} />
        <meshStandardMaterial color="#242723" metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, -2.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#161915" metalness={0.2} roughness={0.6} />
      </mesh>
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} position={[x, 2, -9]}>
          <boxGeometry args={[0.035, 9, 0.08]} />
          <meshStandardMaterial color="#383d34" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

export default function Experience(props: Props) {
  return (
    <Canvas
      aria-hidden="true"
      tabIndex={-1}
      frameloop="demand"
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.5, 8.5], fov: 37, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
      }}
      fallback={null}
    >
      <World {...props} />
    </Canvas>
  );
}
