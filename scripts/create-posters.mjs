/** Offline CPU study of original geometry. This is NOT a WebGL screenshot or a PBR reference. */
import { mkdirSync } from 'node:fs';
import { Matrix4, Euler, OctahedronGeometry, PerspectiveCamera, Vector3 } from 'three';
import sharp from 'sharp';
import { createBlade } from '../src/scene/sculptureGeometry.ts';

mkdirSync('public', { recursive: true });
mkdirSync('docs/studies', { recursive: true });

function render(width, height, concept = 'fold') {
  const mobile = width < 700;
  const camera = new PerspectiveCamera(37, width / height, 0.1, 100);
  camera.position.set(0, 0.5, mobile ? 12.07 : 8.5);
  camera.lookAt(mobile ? 0 : -1.05, mobile ? 1.1 : 0, 0);
  camera.updateMatrixWorld();
  const pixels = Buffer.alloc(width * height * 3);
  const depth = new Float32Array(width * height).fill(Infinity);
  const cx = mobile ? width * 0.5 : width * 0.68;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const glow = Math.exp(
        -(((x - cx) / (width * 0.3)) ** 2 + ((y - height * 0.83) / (height * 0.09)) ** 2),
      );
      const plinth =
        ((x - cx) / (width * (mobile ? 0.32 : 0.23))) ** 2 +
          ((y - height * 0.78) / (height * 0.045)) ** 2 <
        1;
      const offset = (y * width + x) * 3;
      pixels[offset] = 16 + glow * 10 + (plinth ? 2 : 0);
      pixels[offset + 1] = 18 + glow * 14 + (plinth ? 4 : 0);
      pixels[offset + 2] = 16 + glow * 7;
    }
  const blade = createBlade(128, 32, concept),
    core = new OctahedronGeometry(0.51, 0);
  const base = new Matrix4().makeRotationFromEuler(new Euler(0.2, -0.35, -0.18));
  const meshes = [0, 1, 2].map((i) => ({
    geometry: blade,
    matrix: base
      .clone()
      .multiply(new Matrix4().makeRotationFromEuler(new Euler(i * 0.92, i * 2.094, i * 0.28))),
    glass: false,
  }));
  meshes.push({
    geometry: core,
    matrix: base
      .clone()
      .multiply(new Matrix4().makeRotationFromEuler(new Euler(0.3, 0.2, Math.PI / 4))),
    glass: true,
  });
  for (const { geometry, matrix, glass } of meshes) {
    const pos = geometry.getAttribute('position'),
      norm = geometry.getAttribute('normal');
    const vertices = Array.from({ length: pos.count }, (_, i) => {
      const world = new Vector3().fromBufferAttribute(pos, i).applyMatrix4(matrix);
      const screen = world.clone().project(camera);
      const cameraPoint = world.clone().applyMatrix4(camera.matrixWorldInverse);
      const normal = new Vector3().fromBufferAttribute(norm, i).transformDirection(matrix);
      return {
        world,
        normal,
        x: ((screen.x + 1) * width) / 2,
        y: ((1 - screen.y) * height) / 2,
        z: screen.z,
        q: -1 / cameraPoint.z,
      };
    });
    const count = geometry.index?.count ?? pos.count;
    for (let i = 0; i < count; i += 3) {
      const [a, b, c] = [0, 1, 2].map(
        (j) => vertices[geometry.index ? geometry.index.getX(i + j) : i + j],
      );
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (area >= -0.0001) continue;
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))),
        maxX = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))),
        maxY = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++) {
          const u = ((b.x - x - 0.5) * (c.y - y - 0.5) - (b.y - y - 0.5) * (c.x - x - 0.5)) / area;
          const v = ((c.x - x - 0.5) * (a.y - y - 0.5) - (c.y - y - 0.5) * (a.x - x - 0.5)) / area;
          const w = 1 - u - v;
          if (u < 0 || v < 0 || w < 0) continue;
          const z = u * a.z + v * b.z + w * c.z,
            index = y * width + x;
          if (z >= depth[index]) continue;
          depth[index] = z;
          const divisor = u * a.q + v * b.q + w * c.q,
            ua = (u * a.q) / divisor,
            vb = (v * b.q) / divisor,
            wc = (w * c.q) / divisor;
          const normal = new Vector3()
            .copy(a.normal)
            .multiplyScalar(ua)
            .addScaledVector(b.normal, vb)
            .addScaledVector(c.normal, wc)
            .normalize();
          const point = new Vector3()
            .copy(a.world)
            .multiplyScalar(ua)
            .addScaledVector(b.world, vb)
            .addScaledVector(c.world, wc);
          const view = camera.position.clone().sub(point).normalize(),
            reflection = view.clone().negate().reflect(normal);
          const strip =
            Math.exp(-(((reflection.x - 0.62) / 0.11) ** 2)) *
            (0.4 + 0.6 * Math.max(0, reflection.z));
          const softbox = Math.exp(-(((reflection.y - 0.6) / 0.22) ** 2));
          const rim = (1 - Math.max(0, normal.dot(view))) ** 4;
          const luminance = Math.min(1, 0.018 + strip * 0.75 + softbox * 0.85 + rim * 0.08);
          const value = 255 * luminance ** 0.65,
            offset = index * 3;
          pixels[offset] = glass ? value * 0.6 + 18 : value;
          pixels[offset + 1] = glass ? value * 0.8 + 32 : Math.min(255, value + 3);
          pixels[offset + 2] = glass ? value * 0.7 + 24 : Math.min(255, value + 1);
        }
    }
  }
  blade.dispose();
  core.dispose();
  return sharp(pixels, { raw: { width, height, channels: 3 } });
}

await render(1440, 1000).webp({ quality: 90 }).toFile('public/poster.webp');
await render(390, 844).webp({ quality: 90 }).toFile('public/poster-mobile.webp');
for (const concept of ['fold', 'crescent', 'aperture'])
  await render(900, 700, concept).png().toFile(`docs/studies/${concept}.png`);
process.stdout.write('Generated offline approximations, not WebGL captures.\n');
