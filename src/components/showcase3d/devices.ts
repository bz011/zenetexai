import {
  AdditiveBlending,
  BoxGeometry,
  Box3,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
  type Object3D,
  type Texture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ShowcaseKit } from "./kit";
import { roundedPlane, roundedRectShape, roundedSlab } from "./shapes";

/**
 * Procedural devices for the showcase. No model files. The phone is built the
 * way a real one is layered: a machined metal band, a black cover glass set
 * slightly BELOW the band's edge (so there is a real step between frame and
 * display), the screen image on the glass, and a faint reflective layer with a
 * soft diagonal sheen on top. Faces +Z; centred on the origin; a generic
 * device, not a copy of any brand.
 */

export interface Built {
  group: Group;
  /** geometries and materials created here, for disposal (kit materials excluded) */
  owned: { dispose(): void }[];
}

export const PHONE = { w: 3.2, h: 6.6, d: 0.46, r: 0.68 } as const;
const WALL = 0.14;
const BEVEL = 0.045;

/** A rounded-rectangle ring (outer minus inner), bevelled on both edges. */
export function ringGeometry(w: number, h: number, r: number, wall: number, depth: number, bevel: number): ExtrudeGeometry {
  const outer = roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.01, r - bevel));
  outer.holes.push(roundedRectShape(w - wall * 2 + bevel * 2, h - wall * 2 + bevel * 2, Math.max(0.01, r - wall + bevel)));
  const g = new ExtrudeGeometry(outer, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 32,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
}

export function buildPhone(kit: ShowcaseKit, screen: Texture, screenAspect: number, sheen: Texture): Built {
  const { w, h, d, r } = PHONE;
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const group = new Group();

  // machined band with a soft chamfer on both edges (wall must exceed 2 x bevel or the opening inverts)
  group.add(new Mesh(own(ringGeometry(w, h, r, WALL, d, BEVEL)), kit.titanium));

  // solid core behind the glass, so the band is never see-through
  group.add(new Mesh(own(roundedSlab(w - 0.12, h - 0.12, d * 0.66, r - 0.06, 0.03)), kit.bezel));

  // cover glass, recessed below the band's front edge: the frame/display step
  const glassDepth = 0.06;
  const recess = 0.035;
  const glassZ = d / 2 - recess - glassDepth / 2;
  const gw = w - WALL * 2 - 0.02;
  const gh = h - WALL * 2 - 0.02;
  const glass = new Mesh(own(roundedSlab(gw, gh, glassDepth, r - WALL, 0.02)), kit.glassBlack);
  glass.position.z = glassZ;
  group.add(glass);
  const frontZ = glassZ + glassDepth / 2;

  // screen image, inside a black border
  const sw = gw - 0.16;
  const sh = sw / screenAspect;
  const screenMat = own(new MeshBasicMaterial({ map: screen, toneMapped: false }));
  const face = new Mesh(own(roundedPlane(sw, sh, 0.44)), screenMat);
  face.position.z = frontZ + 0.003;
  group.add(face);

  // faint reflective layer + a soft diagonal sheen across the glass
  const cover = new Mesh(own(roundedPlane(gw, gh, r - WALL)), kit.glass);
  cover.position.z = frontZ + 0.006;
  cover.renderOrder = 2;
  group.add(cover);
  const sheenMat = own(
    new MeshBasicMaterial({ map: sheen, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  const sheenFace = new Mesh(own(roundedPlane(gw, gh, r - WALL)), sheenMat);
  sheenFace.position.z = frontZ + 0.009;
  sheenFace.renderOrder = 3;
  group.add(sheenFace);

  // side keys (left: two volume + action, right: power) and two antenna breaks per side
  const key = (bw: number, bh: number, x: number, y: number) => {
    const m = new Mesh(own(new BoxGeometry(bw, bh, d * 0.5)), kit.titanium);
    m.position.set(x, y, 0);
    group.add(m);
  };
  key(0.05, 0.66, -w / 2 - 0.016, 1.15);
  key(0.05, 0.66, -w / 2 - 0.016, 0.28);
  key(0.05, 0.3, -w / 2 - 0.016, 1.98);
  key(0.05, 1.0, w / 2 + 0.016, 0.95);
  const gap = (x: number, y: number) => {
    const m = new Mesh(own(new BoxGeometry(0.01, 0.035, d * 0.86)), kit.bezel);
    m.position.set(x, y, 0);
    group.add(m);
  };
  [-w / 2, w / 2].forEach((x) => [h / 2 - 0.85, -h / 2 + 0.85].forEach((y) => gap(x, y)));

  return { group, owned };
}

/**
 * The real phone asset (see docs/design-v2/assets/PHONE-ASSET-ATTRIBUTION.md):
 * "Modern Generic Smartphone" by Ottto3d, CC BY 4.0, converted to
 * public/models/ai-agents-phone.glb. Its front face was measured directly from
 * the source OBJ (a flat slab UV-mapped to the diffuse texture, no separate
 * screen recess), so PHONE_MODEL gives the real local-space geometry: overall
 * size, and the screen face's rectangle relative to the model's own centre -
 * both in the model's original units, before `loadPhoneModel` centres and
 * scales the asset for the scene.
 */
export const PHONE_MODEL = {
  url: "/models/ai-agents-phone.glb",
  size: { w: 0.075116, h: 0.149653, d: 0.010645 },
  /** screen rect centre and size, relative to the model's own bbox centre */
  screen: { x: 0.0000115, y: 0, z: 0.0053225, w: 0.073077, h: 0.148647 },
} as const;

export interface LoadedPhone {
  /** add to the scene; scale/centred so its own origin is the model centre */
  group: Group;
  dispose(): void;
}

/**
 * Loads the real phone GLB, centres it on its own bounding-box centre, and
 * scales it so its height equals `targetHeight` scene units. Uses the
 * project's shared three.js GLTFLoader (no new dependency).
 *
 * `group` carries the scale; `raw` (the loaded scene) sits inside it with only
 * a position offset (-center), no scale/rotation of its own. That means a
 * sibling added as a DIRECT CHILD of `group` - such as the UI screen plane -
 * must be positioned/sized using PHONE_MODEL.screen's raw (unscaled) numbers:
 * they already live in exactly that same local space (see the attribution doc
 * for how that rectangle was measured), and `group`'s single uniform scale
 * then applies to it correctly, with no separate multiplication needed.
 */
export function loadPhoneModel(targetHeight: number): Promise<LoadedPhone> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      PHONE_MODEL.url,
      (gltf) => {
        const raw = gltf.scene;
        const box = new Box3().setFromObject(raw);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const scale = targetHeight / size.y;

        raw.position.sub(center); // recentre the model on its own bbox centre
        raw.traverse((o: Object3D) => {
          const m = o as Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
          }
        });

        const group = new Group();
        group.add(raw);
        group.scale.setScalar(scale);

        resolve({
          group,
          dispose() {
            raw.traverse((o: Object3D) => {
              const m = o as Mesh;
              if (!m.isMesh) return;
              m.geometry.dispose();
              const mats = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
              mats.forEach((mt) => {
                mt.map?.dispose();
                mt.normalMap?.dispose();
                mt.metalnessMap?.dispose();
                mt.roughnessMap?.dispose();
                mt.aoMap?.dispose();
                mt.dispose();
              });
            });
          },
        });
      },
      undefined,
      reject,
    );
  });
}

export interface PanelBuilt extends Built {
  /** the frame/bezel body */
  body: Mesh;
  /** the textured screen face */
  face: Mesh;
}

/**
 * A generic premium flat panel (tablet/monitor silhouette, not any real
 * product): same layered construction as `buildPhone` - machined frame, a
 * recessed near-black glass base (so the bezel reads as a real step, not a
 * flat sticker), the screen texture, then a faint reflective cover with a
 * diagonal sheen on top. Reuses the exact same kit materials as every other
 * device in the showcase (titanium frame, black glass, faint glass cover).
 */
export function buildDashboardPanel(kit: ShowcaseKit, screen: Texture, w: number, h: number, sheen: Texture): PanelBuilt {
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const group = new Group();
  const depth = 0.56; // was 0.4 - a visibly thicker physical frame (final reference-match pass)
  const r = 0.42;
  const wall = 0.26; // bezel width
  const bevel = 0.065;

  // A ring, not a solid slab: the screen sits recessed in the ring's own
  // hollow opening, exactly like the phone's frame/display step - a solid
  // slab here would simply bury the recessed screen face inside itself.
  const frame = new Mesh(own(ringGeometry(w, h, r, wall, depth, bevel)), kit.titanium);
  group.add(frame);
  // opaque backing behind the hollow, so the ring never looks see-through
  const core = new Mesh(own(roundedSlab(w - 0.12, h - 0.12, depth * 0.66, r - 0.06, 0.03)), kit.bezel);
  group.add(core);

  const glassDepth = 0.07;
  const recess = 0.04;
  const glassZ = depth / 2 - recess - glassDepth / 2;
  const gw = w - wall * 2;
  const gh = h - wall * 2;
  const glassCore = new Mesh(own(roundedSlab(gw, gh, glassDepth, r - wall * 0.6, 0.025)), kit.glassBlack);
  glassCore.position.z = glassZ;
  group.add(glassCore);
  const frontZ = glassZ + glassDepth / 2;

  const sw = gw - 0.1;
  const sh = gh - 0.1;
  const faceMat = own(new MeshBasicMaterial({ map: screen, toneMapped: false }));
  const face = new Mesh(own(roundedPlane(sw, sh, r - wall * 0.7)), faceMat);
  face.position.z = frontZ + 0.004;
  group.add(face);

  const cover = new Mesh(own(roundedPlane(gw, gh, r - wall * 0.6)), kit.glass);
  cover.position.z = frontZ + 0.008;
  cover.renderOrder = 2;
  group.add(cover);
  const sheenMat = own(
    new MeshBasicMaterial({ map: sheen, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  const sheenFace = new Mesh(own(roundedPlane(gw, gh, r - wall * 0.6)), sheenMat);
  sheenFace.position.z = frontZ + 0.011;
  sheenFace.renderOrder = 3;
  group.add(sheenFace);

  return { group, owned, body: frame, face };
}

export interface CardBuilt extends Built {
  /** the card's own body mesh - a clone of kit.cardBody, safe to animate (opacity/emissive) without affecting other cards */
  body: Mesh;
  /** the textured face - already `transparent: true`, safe to fade */
  face: Mesh;
}

/** A floating rounded card: satin dark body with a UI texture on its face. Body and face materials are per-instance, so each card can be faded/lit independently. */
export function buildCard(kit: ShowcaseKit, tex: Texture, w: number, h: number, radius: number, depth = 0.1): CardBuilt {
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const group = new Group();
  const bodyMat = own(kit.cardBody.clone());
  const body = new Mesh(own(roundedSlab(w, h, depth, radius, 0.03)), bodyMat);
  group.add(body);
  const faceMat = own(new MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  const face = new Mesh(own(roundedPlane(w - 0.07, h - 0.07, Math.max(0.02, radius - 0.035))), faceMat);
  face.position.z = depth / 2 + 0.003;
  group.add(face);
  return { group, owned, body, face };
}
