import { buildBrainNetwork } from "@/lib/brainShape";

/**
 * Static poster of the brain network: inline SVG, server-rendered, no JS and
 * no image download. It is what every visitor sees first, and what mobile,
 * reduced-motion and no-WebGL visitors keep. Two <path>s only, so the DOM
 * stays tiny. Decorative: hidden from assistive technology.
 */

const NETWORK = buildBrainNetwork(900, 7, 3);
const YAW = -1.0; // same lateral three-quarter view as the 3D scene (front toward the left)

function project(i: number): [number, number] {
  const x = NETWORK.positions[i * 3], y = NETWORK.positions[i * 3 + 1], z = NETWORK.positions[i * 3 + 2];
  return [x * Math.cos(YAW) + z * Math.sin(YAW), -y];
}

const POINTS = Array.from({ length: NETWORK.positions.length / 3 }, (_, i) => project(i));
const r = (n: number) => Math.round(n * 100) / 100;

const LINES_PATH = (() => {
  let d = "";
  for (let e = 0; e < NETWORK.edges.length; e += 2) {
    const [ax, ay] = POINTS[NETWORK.edges[e]];
    const [bx, by] = POINTS[NETWORK.edges[e + 1]];
    d += `M${r(ax)} ${r(ay)}L${r(bx)} ${r(by)}`;
  }
  return d;
})();

const DOTS_PATH = POINTS.map(([x, y]) => `M${r(x)} ${r(y)}h0`).join("");

/** Defines the network once per page (invisible). Render exactly one of these, then any number of <BrainNetworkUse />. */
export function BrainNetworkDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="zx-brain-grad" gradientUnits="userSpaceOnUse" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="0.55" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <filter id="zx-brain-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.035" />
        </filter>
        <g id="zx-brain-net" fill="none">
          <path d={DOTS_PATH} stroke="url(#zx-brain-grad)" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.45" filter="url(#zx-brain-blur)" />
          <path d={LINES_PATH} stroke="url(#zx-brain-grad)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
          <path d={DOTS_PATH} stroke="#bae6fd" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.95" />
        </g>
      </defs>
    </svg>
  );
}

export function BrainNetworkUse({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="-1.15 -1.15 2.3 2.3" className={className}>
      <use href="#zx-brain-net" />
    </svg>
  );
}
