import type { Group, Light, Vector3 } from "three";

export interface SceneCamera {
  fov: number;
  dist: number;
  target: Vector3;
  /** degrees */
  yaw: number;
  pitch: number;
  /** host aspect (w/h) the scene is composed for; narrower hosts step back */
  designAspect: number;
}

/**
 * A tighter framing of the same, unmoved scene, used on narrow (portrait)
 * screens instead of shrinking the whole desktop composition until its text
 * is unreadable. Centred on the scene's hero object; secondary cards fall
 * outside the frame rather than being crammed in small - the story is still
 * told by the phone/dashboard/core/laptop alone, which is what portrait width
 * has room for. `yaw`/`pitch` default to the desktop camera's own.
 */
export interface PortraitCamera {
  target: Vector3;
  dist: number;
  yaw?: number;
  pitch?: number;
}

export interface ShowcaseScene {
  group: Group;
  /** world positions HTML labels could attach to (none used by the AI Agents scene) */
  anchors: Record<string, Vector3>;
  lights: Light[];
  camera: SceneCamera;
  /** image-based light level for this scene (default 0.85) */
  environmentIntensity?: number;
  /** see PortraitCamera; absent scenes fall back to a scaled-down desktop framing */
  portrait?: PortraitCamera;
  /**
   * Advances this scene's own animation clock by `dtMs`. Only present when the
   * scene has a storytelling sequence (absent, e.g., under reduced motion).
   * Returns true while another frame should be scheduled soon; mountShowcase
   * keeps rendering continuously only while this keeps returning true, and
   * never calls it while the stage is offscreen - so a scene's clock, driven
   * entirely by the dt it is handed, simply stops advancing when paused.
   */
  tick?: (dtMs: number) => boolean;
  /** free geometry and textures owned by this scene */
  dispose(): void;
}
