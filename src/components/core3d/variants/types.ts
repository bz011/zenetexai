import type { Group, Light, Vector3 } from "three";
import type { CoreKit } from "../materials";

export interface CoreFrame {
  /** camera distance from the target, for the hero view */
  dist: number;
  target: Vector3;
  /** degrees: rotation of the camera around Y from +Z toward -X, and elevation */
  yaw: number;
  pitch: number;
}

export interface CoreBuild {
  group: Group;
  /** world positions the HTML labels attach to: in-0..3, out-0..3 */
  anchors: Record<string, Vector3>;
  lights: Light[];
  frame: CoreFrame;
}

export type CoreBuilder = (kit: CoreKit) => CoreBuild;
