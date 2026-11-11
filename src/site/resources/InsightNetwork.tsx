import styles from "./resources.module.css";

/**
 * Featured-insight visual: an abstract decision network. Three inputs feed
 * three processing nodes, which converge on one decision node (teal, with a
 * champagne ring). Light pulses travel the connections very slowly; under
 * reduced motion the network is still. Decorative, SVG only. Never mirrored:
 * it reads left to right in both languages, like the data it suggests.
 */
const inputs = [
  [70, 80],
  [70, 170],
  [70, 260],
];
const middle = [
  [230, 110],
  [230, 230],
  [250, 170],
];
const decision = [400, 170];

function curve([x1, y1]: number[], [x2, y2]: number[]) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

const edges = [
  ...inputs.flatMap((a, i) => middle.filter((_, j) => j !== (i + 1) % 3).map((b) => curve(a, b))),
  ...middle.map((b) => curve(b, decision)),
];

export default function InsightNetwork() {
  return (
    <svg className={styles.network} viewBox="0 0 470 340" role="presentation" aria-hidden="true" focusable="false">
      <g className={styles.edges}>
        {edges.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className={styles.pulses}>
        {edges.map((d, i) => (
          <path key={d} d={d} pathLength={1} style={{ "--d": `${(i * 1.7) % 9}s` } as React.CSSProperties} />
        ))}
      </g>
      <g className={styles.nodes}>
        {inputs.map(([x, y]) => (
          <circle key={`i${y}`} cx={x} cy={y} r={7} className={styles.nodeIn} />
        ))}
        {middle.map(([x, y]) => (
          <circle key={`m${x}${y}`} cx={x} cy={y} r={9} className={styles.nodeMid} />
        ))}
        <circle cx={decision[0]} cy={decision[1]} r={30} className={styles.halo} />
        <circle cx={decision[0]} cy={decision[1]} r={21} className={styles.ring} />
        <circle cx={decision[0]} cy={decision[1]} r={14} className={styles.nodeOut} />
        <path d="M 393 170 l 5 5 l 9 -10" className={styles.tick} />
      </g>
    </svg>
  );
}
