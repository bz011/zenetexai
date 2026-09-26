/**
 * Copy for the Academy hero's product showcase. The showcase is a REAL
 * screenshot of the lesson player (public/academy/lesson-player.webp), so every
 * statement here describes something visible in that image - nothing else.
 */
export const academyShowcaseCopy = {
  en: {
    caption: "The ZentexAI lesson player as students see it: a video lesson beside the course outline.",
    points: [
      { term: "Video lessons", desc: "Each lesson plays in the page, with its length shown." },
      { term: "Course outline", desc: "Modules and lessons in order, with durations." },
      { term: "Progress", desc: "A running count of completed lessons." },
    ],
    altPlayer: "Lesson player showing the video lesson “PMP Course Introduction” (8 minutes) with playback controls",
    altOutline: "Course outline listing modules and lessons with their durations and a count of completed lessons",
  },
  ar: {
    caption: "مشغّل دروس ZentexAI كما يراه الطالب: درس مرئي بجانب مخطط الدورة (لقطة شاشة حقيقية، والواجهة الظاهرة بالإنجليزية).",
    points: [
      { term: "دروس مرئية", desc: "يُشغَّل كل درس داخل الصفحة مع عرض مدته." },
      { term: "مخطط الدورة", desc: "الوحدات والدروس بالترتيب مع مدة كل درس." },
      { term: "التقدّم", desc: "عدّاد لعدد الدروس المكتملة." },
    ],
    altPlayer: "مشغّل الدروس يعرض الدرس المرئي «PMP Course Introduction» (8 دقائق) مع أدوات التشغيل",
    altOutline: "مخطط الدورة يعرض الوحدات والدروس ومدة كل درس وعدد الدروس المكتملة",
  },
} as const;

/** Source screenshot: 1400 x 875. Crop rectangles are in source pixels. */
export const LESSON_PLAYER = {
  src: "/academy/lesson-player.webp",
  width: 1400,
  height: 875,
  player: { x: 60, y: 140, w: 850, h: 545 },
  outline: { x: 905, y: 150, w: 430, h: 560 },
} as const;
