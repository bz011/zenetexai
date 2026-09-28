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

export interface ShowcaseScene {
  group: Group;
  /** world positions HTML labels could attach to (none used by the AI Agents scene) */
  anchors: Record<string, Vector3>;
  lights: Light[];
  camera: SceneCamera;
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
