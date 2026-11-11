/**
 * Homepage v5, sections 3–5: business value. Copy as supplied in the brief.
 * Each heading is two lines; the second line is set in teal. The Arabic
 * headings are split at the natural phrase break so the teal line carries the
 * same idea as the English highlight.
 */
export type ValueImage = "efficiency" | "growth" | "decisions";
export type ValueBlock = { image: ValueImage; eyebrow: string; lead: string; highlight: string; text: string };

const en: ValueBlock[] = [
  {
    image: "efficiency",
    eyebrow: "01 — Efficiency",
    lead: "Save time and",
    highlight: "reduce costs.",
    text: "Automate repetitive tasks, streamline workflows, and free your team to focus on what really matters.",
  },
  {
    image: "growth",
    eyebrow: "02 — Growth & Revenue",
    lead: "Turn opportunities",
    highlight: "into growth.",
    text: "Improve customer engagement, respond faster, and capture more opportunities to grow your business.",
  },
  {
    image: "decisions",
    eyebrow: "03 — Better Decisions",
    lead: "Make smarter",
    highlight: "data-driven decisions.",
    text: "Turn your data into clear insights, identify trends earlier, and make confident decisions for your business.",
  },
];

const ar: ValueBlock[] = [
  {
    image: "efficiency",
    eyebrow: "الكفاءة وخفض التكاليف",
    lead: "وفّر الوقت",
    highlight: "وخفّض التكاليف.",
    text: "أتمت المهام المتكررة، وبسّط إجراءات العمل، وامنح فريقك وقتًا أكبر للتركيز على ما يهم فعلًا.",
  },
  {
    image: "growth",
    eyebrow: "النمو وزيادة الإيرادات",
    lead: "حوّل الفرص",
    highlight: "إلى نمو حقيقي.",
    text: "حسّن تواصلك مع العملاء، واستجب لطلباتهم بسرعة أكبر، واستفد من المزيد من الفرص لتنمية أعمالك.",
  },
  {
    image: "decisions",
    eyebrow: "قرارات أفضل",
    lead: "اتخذ قرارات أذكى",
    highlight: "بالاعتماد على البيانات.",
    text: "حوّل بياناتك إلى رؤى واضحة، واكتشف الاتجاهات مبكرًا، واتخذ قرارات مدروسة بثقة أكبر.",
  },
];

export const valueCopy = { en, ar };
