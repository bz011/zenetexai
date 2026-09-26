/**
 * Decides whether the optional 3D layer may load. Every condition must hold;
 * anything else keeps the SVG diagram, which is always present underneath.
 */
export interface Flow3DEnv {
  /** window.innerWidth in CSS px */
  width: number;
  /** (pointer: fine) - a mouse/trackpad, not a touch screen */
  finePointer: boolean;
  reducedMotion: boolean;
  /** navigator.connection.saveData */
  saveData: boolean;
  webgl: boolean;
}

export const FLOW_3D_MIN_WIDTH = 1024;

export function shouldEnableFlow3D(env: Flow3DEnv, enabled: boolean): boolean {
  return enabled && env.width >= FLOW_3D_MIN_WIDTH && env.finePointer && !env.reducedMotion && !env.saveData && env.webgl;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Browser-only. Reads the current environment. */
export function readFlow3DEnv(): Flow3DEnv {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return {
    width: window.innerWidth,
    finePointer: window.matchMedia("(pointer: fine)").matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: !!nav.connection?.saveData,
    webgl: hasWebGL(),
  };
}
