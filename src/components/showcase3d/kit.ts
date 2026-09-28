import {
  CanvasTexture,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Material,
  type Texture,
} from "three";

/**
 * Shared materials and small helpers for every showcase scene: dark anodised
 * metal for device frames, black bezels, a faint glass layer for screens, and
 * soft (shadow / light-pool) textures generated at runtime. Nothing is fetched.
 */

export interface ShowcaseKit {
  /** device frame: dark titanium */
  titanium: MeshPhysicalMaterial;
  /** display cover glass: near-black, glossy */
  glassBlack: MeshPhysicalMaterial;
  /** small floating cards: darker, satin */
  cardBody: MeshPhysicalMaterial;
  bezel: MeshStandardMaterial;
  /** very faint reflective layer over a screen */
  glass: MeshStandardMaterial;
  /** glossy near-black presentation platform */
  platform: MeshPhysicalMaterial;
  track(t: Texture): Texture;
  dispose(): void;
}

export function createShowcaseKit(): ShowcaseKit {
  const titanium = new MeshPhysicalMaterial({
    color: 0x262c39,
    metalness: 0.95,
    roughness: 0.3,
    anisotropy: 0.35,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.95,
  });
  const glassBlack = new MeshPhysicalMaterial({
    color: 0x02040a,
    metalness: 0,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.3,
  });
  const cardBody = new MeshPhysicalMaterial({
    color: 0x0d1420,
    metalness: 0.25,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.1,
  });
  const bezel = new MeshStandardMaterial({ color: 0x020409, roughness: 0.4, metalness: 0.15 });
  const glass = new MeshStandardMaterial({
    color: 0x000000,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.12,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const platform = new MeshPhysicalMaterial({
    color: 0x05070d,
    metalness: 0.75,
    roughness: 0.4,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.55,
  });
  const textures: Texture[] = [];
  const mats: Material[] = [titanium, glassBlack, cardBody, bezel, glass, platform];
  return {
    titanium,
    glassBlack,
    cardBody,
    bezel,
    glass,
    platform,
    track(t) {
      textures.push(t);
      return t;
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

/** Canvas -> sharp sRGB texture. */
export function canvasTexture(canvas: HTMLCanvasElement, mipmaps = true): CanvasTexture {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = mipmaps;
  t.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
  t.magFilter = LinearFilter;
  return t;
}

export function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

/** +-amt of noise over the canvas so dark gradients do not band. */
export function dither(g: CanvasRenderingContext2D, w: number, h: number, amt = 2.2): void {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  let seed = 7331;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const n = ((seed / 2147483647) - 0.5) * 2 * amt;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

/** A soft dark ellipse (contact shadow) with alpha falling off to 0. */
export function softShadowTexture(): CanvasTexture {
  const { c, g } = makeCanvas(256, 256);
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(0,0,0,0.85)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.38)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return canvasTexture(c, false);
}

/** A soft coloured pool of light: radial gradient, dithered, alpha to 0 at the rim. */
export function lightPoolTexture(rgb: [number, number, number], peak = 0.5): CanvasTexture {
  const size = 512;
  const { c, g } = makeCanvas(size, size);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, gr, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gr},${b},${peak})`);
  grad.addColorStop(0.5, `rgba(${r},${gr},${b},${peak * 0.32})`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return canvasTexture(c, false);
}

/** A soft black radial fade, used to gently darken the plate behind the hero object. */
export function vignetteTexture(peak = 0.55): CanvasTexture {
  const size = 512;
  const { c, g } = makeCanvas(size, size);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(0,0,0,${peak})`);
  grad.addColorStop(0.6, `rgba(0,0,0,${peak * 0.45})`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return canvasTexture(c, false);
}

/**
 * Cover-fit (like CSS background-size: cover) repeat/offset for a Texture used
 * as scene.background: crops the plate to fill the canvas without stretching.
 */
export function coverFit(texture: Texture, canvasAspect: number, imageAspect: number): void {
  if (canvasAspect > imageAspect) {
    texture.repeat.set(1, imageAspect / canvasAspect);
    texture.offset.set(0, (1 - texture.repeat.y) / 2);
  } else {
    texture.repeat.set(canvasAspect / imageAspect, 1);
    texture.offset.set((1 - texture.repeat.x) / 2, 0);
  }
}

/**
 * A copy of `mat` for the mirrored reflection under a floating object: it is
 * transparent and fades to nothing the further below the floor a fragment is.
 * The numbers are baked into the shader so every reflected material shares one
 * compiled program.
 */
export function reflectionMaterial<T extends Material>(mat: T, floorY: number, span: number, peak: number): T {
  const m = mat.clone() as T;
  m.transparent = true;
  m.depthWrite = false;
  const f = (n: number) => n.toFixed(4);
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vReflY;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvReflY = (modelMatrix * vec4(transformed, 1.0)).y;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vReflY;")
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(${f(floorY - span)}, ${f(floorY)}, vReflY) * ${f(peak)};`,
      );
  };
  return m;
}
