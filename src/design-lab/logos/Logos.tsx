/**
 * Three ZentexAI logo concepts for the local design lab. Vector geometry on a
 * 64-unit grid; one ink colour plus one teal signal, no gradients. Wordmarks
 * are set in Hanken Grotesk here and would be converted to outlines for a
 * final brand file.
 */

export type LogoId = 1 | 2 | 3;
export type Surface = "light" | "dark";

const INK = { light: "#1c232e", dark: "#f2ede4" };
const GROUND = { light: "#f7f3ec", dark: "#1c232e" };
const SIGNAL = { light: "#1e5b5e", dark: "#5fb3a6" };

/** Concept 1, Gate: two offset brackets frame a passage; a teal block passes through it. */
function GateIcon({ surface }: { surface: Surface }) {
  return (
    <>
      <path d="M8 8H40V19H19V40H8Z" fill={INK[surface]} />
      <path d="M56 56H24V45H45V24H56Z" fill={INK[surface]} />
      <rect x="27" y="27" width="10" height="10" fill={SIGNAL[surface]} />
    </>
  );
}

/** Concept 2, Ascent: three isometric plates, each stepped up and over: layered systems that build on each other. */
function AscentIcon({ surface }: { surface: Surface }) {
  const ink = INK[surface];
  const gap = { stroke: GROUND[surface], strokeWidth: 3, strokeLinejoin: "round" as const };
  return (
    <>
      <path d="M4 42L28 30L52 42L28 54Z" fill={ink} {...gap} />
      <path d="M8 32L32 20L56 32L32 44Z" fill={ink} {...gap} />
      <path d="M12 22L36 10L60 22L36 34Z" fill={SIGNAL[surface]} {...gap} />
    </>
  );
}

/** Concept 3, Relay: one continuous engineered route, from an open input node to a resolved teal output. */
function RelayIcon({ surface }: { surface: Surface }) {
  const ink = INK[surface];
  return (
    <>
      <circle cx="13" cy="15" r="6" fill="none" stroke={ink} strokeWidth="5" />
      <path d="M19 15H32V47H44" fill="none" stroke={ink} strokeWidth="7" strokeLinejoin="miter" strokeLinecap="butt" />
      <rect x="44" y="38" width="17" height="17" fill={SIGNAL[surface]} />
    </>
  );
}

const ICONS = { 1: GateIcon, 2: AscentIcon, 3: RelayIcon } as const;

export const CONCEPTS: { id: LogoId; name: string; idea: string; rationale: string; wordmark: { text: string; ai?: string; tracking: number; weight: number; caps?: boolean } }[] = [
  {
    id: 1,
    name: "Gate",
    idea: "Automation that passes only through the boundaries you set.",
    rationale:
      "Two offset brackets form a frame with a single passage; a teal block moves through it. It is ZentexAI's promise drawn as geometry: systems act inside approved limits, and everything is accounted for. The square forms stay crisp down to 16 px and read as engineered, not decorative. The wordmark is set in wide capitals, like a label on a precision instrument. Risk: wide-tracked capitals lose legibility at small sizes, so below about 20 px the mark should be used alone.",
    wordmark: { text: "ZENTEX", ai: "AI", tracking: 0.16, weight: 600, caps: true },
  },
  {
    id: 2,
    name: "Ascent",
    idea: "Layered systems, each step building on the one below.",
    rationale:
      "Three isometric plates stacked into one compact form, the top one in teal. It reads as layers of a system (knowledge, rules, action) and as progression, which also carries the Academy: knowledge built step by step. It is drawn on the same isometric grid as the A5 visuals, so the mark and the illustrations feel like one family. Risk: stacked layers are a familiar motif, so the teal top plate and the A5 illustrations have to carry its distinctiveness.",
    wordmark: { text: "Zentex", ai: "AI", tracking: -0.02, weight: 500 },
  },
  {
    id: 3,
    name: "Relay",
    idea: "One controlled route from request to result.",
    rationale:
      "A single trace leaves an open input node, steps down once at a right angle and lands in a solid teal output, like a connection on an engineering drawing. It is an orchestrated process reduced to its essence: a request travels a defined path to a result. It avoids letterforms entirely, and the heavy uniform stroke keeps it legible as a favicon. Risk: on its own it can read as a generic connector, so it relies on the wordmark more than the other two.",
    wordmark: { text: "zentexai", tracking: -0.03, weight: 600 },
  },
];

export function LogoIcon({ id, surface = "light", size = 32, title }: { id: LogoId; surface?: Surface; size?: number; title?: string }) {
  const Icon = ICONS[id];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ display: "block", flex: "none" }}>
      <Icon surface={surface} />
    </svg>
  );
}

/** Icon plus wordmark. Always left-to-right, like any brand lockup. */
export function LogoLockup({ id, surface = "light", height = 32, label = "ZentexAI" }: { id: LogoId; surface?: Surface; height?: number; label?: string }) {
  const c = CONCEPTS.find((x) => x.id === id)!;
  const w = c.wordmark;
  const ink = INK[surface];
  const signal = SIGNAL[surface];
  return (
    <span dir="ltr" role="img" aria-label={label} style={{ display: "inline-flex", alignItems: "center", gap: height * 0.34, height, lineHeight: 1 }}>
      <LogoIcon id={id} surface={surface} size={height} />
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--a3-sans), 'Hanken Grotesk', sans-serif",
          fontWeight: w.weight,
          fontSize: height * (w.caps ? 0.5 : 0.66),
          letterSpacing: `${w.tracking}em`,
          color: ink,
          whiteSpace: "nowrap",
        }}
      >
        {w.text}
        {w.ai && <span style={{ color: signal, marginInlineStart: w.caps ? "0.35em" : 0 }}>{w.ai}</span>}
      </span>
    </span>
  );
}
