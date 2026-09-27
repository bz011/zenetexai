import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  type Material,
  type Texture,
} from "three";

/**
 * Materials for the Intelligence Core. The target is a dark, precision-machined
 * surface (anodised graphite): a physically based metal with anisotropic
 * highlights and a fine brushed roughness pattern generated on a canvas at
 * runtime - no image assets, nothing fetched. Colour from the brand appears
 * only as emissive light (path, gate edges, state strips), never as a coating.
 */

/** Fine horizontal brushing, used as a roughness variation map (green channel). */
function brushedTexture(): Texture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(170,170,170)";
  g.fillRect(0, 0, size, size);
  // deterministic pseudo-random so the look is identical on every load
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 2600; i++) {
    const y = rnd() * size;
    const x = rnd() * size;
    const len = 30 + rnd() * 240;
    const v = rnd() > 0.5 ? 255 : 90;
    g.strokeStyle = `rgba(${v},${v},${v},${0.03 + rnd() * 0.07})`;
    g.lineWidth = 0.6 + rnd() * 1.1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (rnd() - 0.5) * 1.2);
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = NoColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  return tex;
}

export interface CoreKit {
  /** primary machined surface */
  graphite: MeshPhysicalMaterial;
  /** recessed / secondary surfaces */
  graphiteDark: MeshPhysicalMaterial;
  /** matte technical polymer: shutters, standoffs, sheaths */
  polymer: MeshStandardMaterial;
  /** emissive strips with per-vertex colour (blue -> cyan) */
  lightVC: MeshBasicMaterial;
  /** solid emissive: active gate edges, state strips */
  lightCyan: MeshBasicMaterial;
  lightBlue: MeshBasicMaterial;
  /** faint volume of the signal path between stages */
  beam: MeshBasicMaterial;
  dispose: () => void;
}

export function createKit(): CoreKit {
  const brushed = brushedTexture();

  const graphite = new MeshPhysicalMaterial({
    color: 0x3b4556,
    metalness: 0.66,
    roughness: 0.46,
    roughnessMap: brushed,
    anisotropy: 0.6,
    envMapIntensity: 1.0,
  });
  const graphiteDark = new MeshPhysicalMaterial({
    color: 0x1f2735,
    metalness: 0.62,
    roughness: 0.55,
    roughnessMap: brushed,
    anisotropy: 0.4,
    envMapIntensity: 0.8,
  });
  const polymer = new MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.78, metalness: 0.05 });

  const lightVC = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const lightCyan = new MeshBasicMaterial({ color: 0x3ee0f4, toneMapped: false });
  const lightBlue = new MeshBasicMaterial({ color: 0x3b7bf5, toneMapped: false });
  const beam = new MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.04,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  });

  const all: Material[] = [graphite, graphiteDark, polymer, lightVC, lightCyan, lightBlue, beam];
  return {
    graphite,
    graphiteDark,
    polymer,
    lightVC,
    lightCyan,
    lightBlue,
    beam,
    dispose() {
      brushed.dispose();
      all.forEach((m) => m.dispose());
    },
  };
}
