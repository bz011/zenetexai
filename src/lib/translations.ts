export type Lang = "en" | "ar";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface ServiceItem { tag: string; title: string; desc: string; icon: string }
interface CourseItem { title: string; tag: string; desc: string; status: string; duration: string }
interface ToolItem { title: string; category: string; desc: string; icon: string }
interface ProcessStep { step: string; title: string; desc: string }
interface ValueItem { title: string; desc: string }
interface PillarItem { label: string; desc: string }
interface FeatureItem { title: string; desc: string }
interface BenefitItem { title: string; desc: string }
interface BlogPost { id: string; title: string; tag: string; desc: string; readTime: string }
interface ContactDetail { id: string; label: string; value: string; href: string | null; icon: string }

// ─── Translation shape ────────────────────────────────────────────────────────

export interface Translations {
  nav: {
    home: string; services: string; academy: string; tools: string;
    about: string; blog: string; contact: string; login: string;
  };
  footer: { tagline: string; rights: string; email: string };
  shared: {
    available: string; coming_soon: string; in_development: string;
    launching_soon: string; contact_us: string; about_us: string;
    enroll: string; learn_more: string; view_all: string;
    send_message: string; coming_soon_inline: string;
    content_note: string; week: string; weeks: string;
  };
  hero: {
    badge: string; headline1: string; headline2: string;
    sub: string; cta_primary: string; cta_secondary: string; region_note: string;
  };
  cta: { badge: string; headline: string; sub: string };
  form: {
    name: string; name_placeholder: string; email: string; email_placeholder: string;
    company: string; company_placeholder: string; company_optional: string;
    message: string; message_placeholder: string; submit: string; submitting: string;
    success_title: string; success_sub: string; send_another: string;
  };
  home: {
    pillars: PillarItem[];
    services_eyebrow: string; services_h2: string; services_sub: string;
    services: ServiceItem[];
    services_link1: string; services_link2: string;
    academy_eyebrow: string; academy_h2_line1: string; academy_h2_line2: string;
    academy_p1: string; academy_p2: string;
    academy_btn1: string; academy_btn2: string;
    academy_courses: { label: string; status: string }[];
    tools_eyebrow: string; tools_h2: string; tools_sub: string;
    tools: { title: string; desc: string; category: string }[];
    tools_link: string;
    why_eyebrow: string; why_h2: string; why_sub: string;
    benefits: BenefitItem[];
  };
  services: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    cards: ServiceItem[];
    process_eyebrow: string; process_h2: string;
    process: ProcessStep[];
    cta_h2: string; cta_p: string; cta_btn1: string; cta_btn2: string;
  };
  academy: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    hero_btn1: string; hero_btn2: string;
    features: FeatureItem[];
    courses_eyebrow: string; courses_h2: string;
    courses: CourseItem[];
    bottom_h2: string; bottom_p: string; bottom_btn: string;
  };
  tools: {
    hero_badge: string; hero_h1: string; hero_sub: string;
    tools: ToolItem[];
    waitlist_eyebrow: string; waitlist_h2: string; waitlist_p: string; waitlist_btn: string;
  };
  about: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    mission_eyebrow: string; mission_h2_line1: string; mission_h2_line2: string;
    mission_p1: string; mission_p2: string;
    pillars: PillarItem[];
    values_eyebrow: string; values_h2: string;
    values: ValueItem[];
    team_eyebrow: string; team_h2: string; team_p: string; team_btn: string;
  };
  blog: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    featured_label: string; all_label: string;
    coming_soon: string; content_note: string;
    featured: BlogPost;
    posts: BlogPost[];
  };
  login: {
    tagline: string; email: string; password: string;
    btn: string; note: string; not_member: string; get_in_touch: string;
  };
  contact: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    form_heading: string; details: ContactDetail[]; note: string;
  };
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    home: "Home", services: "Services", academy: "Academy", tools: "Tools",
    about: "About", blog: "Blog", contact: "Contact", login: "Login",
  },
  footer: {
    tagline: "AI services, professional training, and intelligent tools — built for the MENA region.",
    rights: "All rights reserved.",
    email: "hello@zenetexai.com",
  },
  shared: {
    available: "Available", coming_soon: "Coming Soon", in_development: "In Development",
    launching_soon: "Launching Soon", contact_us: "Contact Us", about_us: "About Us",
    enroll: "Enroll →", learn_more: "Learn more →", view_all: "View all →",
    send_message: "Send Message", coming_soon_inline: "Coming Soon",
    content_note: "Content is being prepared. Check back soon.",
    week: "week", weeks: "weeks",
  },
  hero: {
    badge: "AI Services · Academy · Tools",
    headline1: "Build Smarter.",
    headline2: "Grow Faster with AI.",
    sub: "ZENTEXAI helps businesses adopt AI through expert consulting, certified training, and purpose-built tools — designed for the MENA market.",
    cta_primary: "Talk to Our Team",
    cta_secondary: "Explore Services",
    region_note: "Serving businesses across Saudi Arabia and the wider MENA region",
  },
  cta: {
    badge: "Get in Touch",
    headline: "Let's Work Together",
    sub: "Tell us about your business and what you're trying to solve. We'll come back with a clear proposal — no pressure.",
  },
  form: {
    name: "Full Name", name_placeholder: "Your name",
    email: "Email", email_placeholder: "you@company.com",
    company: "Company", company_placeholder: "Your company name", company_optional: "(optional)",
    message: "Message", message_placeholder: "Describe your project or what you need help with...",
    submit: "Send Message", submitting: "Sending…",
    success_title: "Message Received",
    success_sub: "Thank you for reaching out. A member of our team will be in touch within 24 hours.",
    send_another: "Send another message",
  },

  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    pillars: [
      { label: "AI Services", desc: "Consulting, agents, and custom builds" },
      { label: "Academy", desc: "PMP certification and AI training" },
      { label: "Tools", desc: "Industry-specific SaaS — coming soon" },
      { label: "MENA", desc: "Focused on Saudi Arabia and the region" },
    ],
    services_eyebrow: "AI Services",
    services_h2: "We Build AI That Works in the Real World",
    services_sub: "From AI agents and chatbots to machine learning models and AI-powered websites — we design, build, and deploy solutions tailored to your business.",
    services: [
      { tag: "AI Agents", title: "Custom AI Agents", icon: "◎",
        desc: "We build AI agents that handle complex tasks autonomously — customer queries, lead qualification, scheduling, and more. Deployed to fit your existing systems." },
      { tag: "AI Chatbots", title: "Intelligent Chatbots", icon: "◇",
        desc: "Conversational AI built for your business context. Whether for sales, support, or internal use — we design and deploy chatbots that actually perform." },
      { tag: "Data & ML", title: "Data Analysis & Machine Learning", icon: "▦",
        desc: "Turn your data into decisions. We develop models, pipelines, and dashboards that give you clear, actionable insight from your business data." },
      { tag: "Web & AI", title: "Website & AI Integration", icon: "◈",
        desc: "Need a professional website with AI built in? We design and develop web experiences that include intelligent features from day one." },
    ],
    services_link1: "See all services →",
    services_link2: "Request a consultation →",
    academy_eyebrow: "ZENTEXAI Academy",
    academy_h2_line1: "Professional Training",
    academy_h2_line2: "Starting with PMP",
    academy_p1: "The Academy opens with our PMP Certification Preparation programme — structured, practical, and designed to get you exam-ready. AI and technical courses follow in the next phase.",
    academy_p2: "Whether you're preparing for PMP or looking to build AI skills for your team, the Academy will grow with your career.",
    academy_btn1: "View Courses",
    academy_btn2: "Ask Us Anything",
    academy_courses: [
      { label: "PMP Certification Preparation", status: "Available" },
      { label: "AI for Business Leaders", status: "Coming Soon" },
      { label: "Prompt Engineering in Practice", status: "Coming Soon" },
      { label: "Machine Learning Fundamentals", status: "Coming Soon" },
    ],
    tools_eyebrow: "ZENTEXAI Tools",
    tools_h2: "Proprietary AI Tools — In Development",
    tools_sub: "We are building a suite of AI-powered SaaS tools focused on education, construction, and project management. Designed for professionals who need more than generic software.",
    tools: [
      { title: "PMP Exam Simulator", category: "Education",
        desc: "Timed exam simulations, adaptive question banks, and performance tracking — built specifically for PMP candidates." },
      { title: "Construction Project AI", category: "Construction",
        desc: "AI tools for construction project managers — scheduling, cost tracking, risk flags, and progress reporting." },
      { title: "AI Project Planner", category: "Project Management",
        desc: "AI-assisted project planning for teams — scope definition, task breakdown, and timeline generation." },
    ],
    tools_link: "Learn more about our tools →",
    why_eyebrow: "Why ZENTEXAI",
    why_h2: "What Makes Us Different",
    why_sub: "We are an AI company built for the region — not a global firm with a regional office. That difference shows in how we work.",
    benefits: [
      { title: "Real Delivery, Not Consulting Reports",
        desc: "We build and deploy — not just advise. Every engagement ends with a working solution in your hands." },
      { title: "Domain Expertise",
        desc: "Our team brings experience across AI engineering, project management, construction, and education." },
      { title: "Bilingual by Design",
        desc: "We work in both Arabic and English. Our solutions are built for the MENA market, not translated for it." },
      { title: "Clear Pricing, Clear Scope",
        desc: "No vague retainers. Every project starts with a defined scope, timeline, and deliverable." },
      { title: "Post-Delivery Support",
        desc: "We stay available after launch — for adjustments, training, and scaling what works." },
      { title: "Three Pillars, One Partner",
        desc: "Services, training, and tools under one roof — so your team grows alongside the solutions we build." },
    ],
  },

  // ── Services ────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "What We Offer",
    hero_h1: "AI Services",
    hero_sub: "Premium AI solutions designed to accelerate your business. From strategy to execution — we deliver results.",
    cards: [
      { tag: "Strategy", title: "AI Strategy Consulting", icon: "◈",
        desc: "We help businesses define and execute a clear AI roadmap — from opportunity mapping to implementation planning. No fluff, just a real path forward." },
      { tag: "Automation", title: "Process Automation", icon: "⟳",
        desc: "Automate repetitive tasks and complex workflows with intelligent AI agents. Free your team for work that actually matters." },
      { tag: "Growth", title: "Lead Generation AI", icon: "◎",
        desc: "AI-powered lead generation tailored to your target market. Identify, qualify, and engage the right prospects at scale." },
      { tag: "Custom Build", title: "Custom AI Solutions", icon: "◇",
        desc: "Bespoke AI systems designed around your business needs — from chatbots and recommendation engines to predictive analytics." },
      { tag: "Data", title: "Data Analysis & Insights", icon: "▦",
        desc: "Turn raw data into actionable intelligence. We design dashboards, models, and reports that drive smarter decisions." },
      { tag: "Integration", title: "AI Integration", icon: "⊕",
        desc: "Integrate AI capabilities into your existing tools, platforms, and workflows — with minimal disruption and maximum impact." },
    ],
    process_eyebrow: "How We Work",
    process_h2: "Our Process",
    process: [
      { step: "01", title: "Discovery", desc: "We start by understanding your business, goals, and challenges." },
      { step: "02", title: "Strategy", desc: "We design a tailored AI roadmap and solution architecture." },
      { step: "03", title: "Build", desc: "Our team builds, tests, and refines your AI solution." },
      { step: "04", title: "Deliver", desc: "We deploy, train your team, and stay with you post-launch." },
    ],
    cta_h2: "Ready to build something great?",
    cta_p: "Tell us about your project. We'll respond within 24 hours.",
    cta_btn1: "Contact Us",
    cta_btn2: "About Us",
  },

  // ── Academy ─────────────────────────────────────────────────────────────────
  academy: {
    hero_eyebrow: "Learn & Grow",
    hero_h1: "ZENTEXAI Academy",
    hero_sub: "Professional courses built for the AI era. Get certified, stay relevant, and lead with confidence.",
    hero_btn1: "Enroll Now",
    hero_btn2: "Browse Courses",
    features: [
      { title: "Expert Instructors", desc: "Learn from practitioners with real-world AI and project management experience." },
      { title: "Flexible Learning", desc: "Self-paced modules designed for busy professionals. Learn on your schedule." },
      { title: "Certified Outcomes", desc: "Courses aligned with industry certifications including PMP." },
      { title: "MENA-Focused", desc: "Content designed for the Gulf and MENA business landscape." },
    ],
    courses_eyebrow: "Courses",
    courses_h2: "All Courses",
    courses: [
      { title: "PMP Certification Prep", tag: "Project Management", status: "Available", duration: "8 weeks",
        desc: "Comprehensive preparation for the PMP exam — structured modules, practice questions, and expert guidance." },
      { title: "AI for Business Leaders", tag: "Artificial Intelligence", status: "Coming Soon", duration: "4 weeks",
        desc: "Understand AI without the jargon. Learn to identify opportunities, evaluate tools, and lead AI initiatives." },
      { title: "Prompt Engineering Mastery", tag: "AI Skills", status: "Coming Soon", duration: "3 weeks",
        desc: "Master the art of working with large language models. Practical techniques for real business workflows." },
      { title: "Machine Learning Fundamentals", tag: "Data Science", status: "Coming Soon", duration: "6 weeks",
        desc: "From data to models — a practical introduction to machine learning for professionals." },
      { title: "AI Tools for Construction", tag: "Industry Specific", status: "Coming Soon", duration: "4 weeks",
        desc: "Purpose-built AI training for construction professionals — planning, safety, and project management." },
      { title: "Edutech & AI in Education", tag: "Edutech", status: "Coming Soon", duration: "3 weeks",
        desc: "How AI is reshaping education — course design, personalisation, and the future of learning." },
    ],
    bottom_h2: "Not sure which course to take?",
    bottom_p: "Our team can help you find the right learning path for your goals.",
    bottom_btn: "Talk to Us",
  },

  // ── Tools ────────────────────────────────────────────────────────────────────
  tools: {
    hero_badge: "Launching Soon",
    hero_h1: "AI-Powered Tools",
    hero_sub: "A suite of intelligent SaaS tools for education, construction, and project management — designed for the way professionals actually work.",
    tools: [
      { title: "PMP Exam Simulator", category: "Education", icon: "◎",
        description: "Adaptive exam simulator for PMP certification preparation. Thousands of questions, timed sessions, and performance analytics." } as unknown as ToolItem,
      { title: "AI Project Planner", category: "Project Management", icon: "◈",
        description: "Intelligent project planning powered by AI. From scope definition to resource allocation — smarter planning, better outcomes." } as unknown as ToolItem,
      { title: "Construction AI Assistant", category: "Construction", icon: "◇",
        description: "AI tools built for the construction industry — safety audits, schedule optimisation, and site reporting made simple." } as unknown as ToolItem,
      { title: "Smart Course Builder", category: "Edutech", icon: "⊕",
        description: "Create and manage AI-enhanced online courses. Intelligent content structuring, assessment generation, and learner insights." } as unknown as ToolItem,
    ],
    waitlist_eyebrow: "Early Access",
    waitlist_h2: "Be the first to know",
    waitlist_p: "Join the waitlist and get priority access when we launch.",
    waitlist_btn: "Join the Waitlist",
  },

  // ── About ────────────────────────────────────────────────────────────────────
  about: {
    hero_eyebrow: "Our Story",
    hero_h1: "About ZENTEXAI",
    hero_sub: "We exist to make premium AI real — not theoretical. For businesses in the MENA region ready to lead.",
    mission_eyebrow: "Mission",
    mission_h2_line1: "AI that actually",
    mission_h2_line2: "delivers results",
    mission_p1: "ZENTEXAI exists to make premium AI accessible to professionals and businesses across the region. We combine world-class services, education, and tools under one roof — built for those who refuse to settle for average.",
    mission_p2: "We believe AI isn't just for tech companies. Every sector — construction, education, project management — deserves intelligent tools built to their specific needs.",
    pillars: [
      { label: "AI Services", desc: "Consulting, automation, and custom builds." },
      { label: "Academy", desc: "Professional courses and certifications." },
      { label: "Tools", desc: "SaaS tools for key industries." },
    ],
    values_eyebrow: "Values",
    values_h2: "What We Stand For",
    values: [
      { title: "Excellence",
        desc: "We hold ourselves to the highest standard in everything we build — from a single module to an entire AI system." },
      { title: "Innovation",
        desc: "We push boundaries and continuously explore what AI can do for every industry we operate in." },
      { title: "Impact",
        desc: "We measure success by the real-world results we deliver — not by outputs, but by outcomes." },
    ],
    team_eyebrow: "The Team",
    team_h2: "The People Behind ZENTEXAI",
    team_p: "A team of AI specialists, educators, and industry experts. Detailed team profiles coming soon.",
    team_btn: "Work With Us",
  },

  // ── Blog ─────────────────────────────────────────────────────────────────────
  blog: {
    hero_eyebrow: "Insights",
    hero_h1: "Blog",
    hero_sub: "Thoughts, guides, and insights from the ZENTEXAI team.",
    featured_label: "Featured",
    all_label: "All Articles",
    coming_soon: "Coming Soon",
    content_note: "Content is being prepared. Check back soon.",
    featured: {
      id: "ai", tag: "AI", readTime: "8 min read",
      title: "The Future of AI in Project Management",
      desc: "How artificial intelligence is reshaping the way projects are planned, executed, and delivered — and what it means for the next generation of project managers.",
    },
    posts: [
      { id: "academy", tag: "Academy", readTime: "6 min read",
        title: "How to Pass the PMP Exam in 2025",
        desc: "A practical guide to preparing for the PMP exam with modern AI-assisted study tools." },
      { id: "tools", tag: "Tools", readTime: "5 min read",
        title: "Top AI Tools for Construction Teams",
        desc: "From site safety to schedule optimisation — the AI tools making construction smarter." },
      { id: "services", tag: "Services", readTime: "7 min read",
        title: "Why Every Business Needs an AI Strategy",
        desc: "Companies without an AI strategy are already falling behind. Here's where to start." },
      { id: "skills", tag: "AI Skills", readTime: "4 min read",
        title: "Prompt Engineering: The New Professional Skill",
        desc: "Why knowing how to work with AI models is becoming as essential as knowing how to use spreadsheets." },
    ],
  },

  // ── Login ────────────────────────────────────────────────────────────────────
  login: {
    tagline: "Sign in to your account",
    email: "Email", password: "Password",
    btn: "Sign In",
    note: "Authentication system coming in a future release.",
    not_member: "Not a member?",
    get_in_touch: "Get in touch",
  },

  // ── Contact ──────────────────────────────────────────────────────────────────
  contact: {
    hero_eyebrow: "Get in Touch",
    hero_h1: "Contact Us",
    hero_sub: "Have a project in mind or want to learn more? We'd love to hear from you.",
    form_heading: "Send us a message",
    details: [
      { id: "email", label: "Email", value: "hello@zenetexai.com", href: "mailto:hello@zenetexai.com", icon: "✉" },
      { id: "whatsapp", label: "WhatsApp", value: "+966 00 000 0000", href: "https://wa.me/96600000000", icon: "◎" },
      { id: "response", label: "Response Time", value: "Within 24 hours", href: null, icon: "◷" },
    ],
    note: "No commitment required. Tell us your challenge and we'll propose a clear path forward — no pressure, no fluff.",
  },
};

// ─── Arabic ───────────────────────────────────────────────────────────────────

const ar: Translations = {
  nav: {
    home: "الرئيسية", services: "الخدمات", academy: "الأكاديمية", tools: "الأدوات",
    about: "من نحن", blog: "المدونة", contact: "تواصل معنا", login: "تسجيل الدخول",
  },
  footer: {
    tagline: "خدمات ذكاء اصطناعي، تدريب احترافي، وأدوات متخصصة — مصممة لسوق الشرق الأوسط وشمال أفريقيا.",
    rights: "جميع الحقوق محفوظة.",
    email: "hello@zenetexai.com",
  },
  shared: {
    available: "متاح الآن", coming_soon: "قريباً", in_development: "قيد التطوير",
    launching_soon: "إطلاق قريب", contact_us: "تواصل معنا", about_us: "من نحن",
    enroll: "← سجّل الآن", learn_more: "← اعرف أكثر", view_all: "← عرض الكل",
    send_message: "إرسال الرسالة", coming_soon_inline: "قريباً",
    content_note: "المحتوى قيد الإعداد. تفقّد الموقع لاحقاً.",
    week: "أسبوع", weeks: "أسابيع",
  },
  hero: {
    badge: "الخدمات · الأكاديمية · الأدوات",
    headline1: "أعمالك أذكى.",
    headline2: "نموك أسرع مع الذكاء الاصطناعي.",
    sub: "تساعد ZENTEXAI الشركات على تبني الذكاء الاصطناعي عبر الاستشارات المتخصصة، والتدريب المعتمد، والأدوات المصممة لسوق منطقة الشرق الأوسط.",
    cta_primary: "تحدث إلى فريقنا",
    cta_secondary: "استكشف الخدمات",
    region_note: "نخدم الشركات في المملكة العربية السعودية ومنطقة الشرق الأوسط وشمال أفريقيا",
  },
  cta: {
    badge: "تواصل معنا",
    headline: "لنعمل معاً",
    sub: "أخبرنا عن أعمالك وما تسعى لتحقيقه. سنعود إليك بمقترح واضح — دون أي إلزام.",
  },
  form: {
    name: "الاسم الكامل", name_placeholder: "اسمك",
    email: "البريد الإلكتروني", email_placeholder: "you@company.com",
    company: "الشركة", company_placeholder: "اسم شركتك", company_optional: "(اختياري)",
    message: "الرسالة", message_placeholder: "صف مشروعك أو ما تحتاج المساعدة فيه...",
    submit: "إرسال الرسالة", submitting: "جارٍ الإرسال…",
    success_title: "تم استلام رسالتك",
    success_sub: "شكراً على تواصلك. سيتواصل معك أحد أعضاء فريقنا خلال 24 ساعة.",
    send_another: "إرسال رسالة أخرى",
  },

  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    pillars: [
      { label: "خدمات الذكاء الاصطناعي", desc: "استشارات، وكلاء ذكاء اصطناعي، وبناء مخصص" },
      { label: "الأكاديمية", desc: "شهادة PMP وتدريب على الذكاء الاصطناعي" },
      { label: "الأدوات", desc: "أدوات SaaS متخصصة — قريباً" },
      { label: "منطقة MENA", desc: "تركيز على المملكة العربية السعودية والمنطقة" },
    ],
    services_eyebrow: "خدماتنا",
    services_h2: "نبني ذكاءً اصطناعياً يعمل في الواقع الفعلي",
    services_sub: "من وكلاء الذكاء الاصطناعي والمحادثة إلى نماذج التعلم الآلي والمواقع الذكية — نصمم ونبني وننشر حلولاً مصممة لأعمالك.",
    services: [
      { tag: "وكلاء ذكاء اصطناعي", title: "وكلاء ذكاء اصطناعي مخصصون", icon: "◎",
        desc: "نبني وكلاء ذكاء اصطناعي يتولون مهام معقدة بشكل مستقل — استفسارات العملاء، تأهيل العملاء المحتملين، الجدولة، والمزيد." },
      { tag: "المحادثة الذكية", title: "روبوتات المحادثة الذكية", icon: "◇",
        desc: "ذكاء اصطناعي محادثي مصمم لسياق عملك — للمبيعات، الدعم، أو الاستخدام الداخلي. نصمم وننشر روبوتات تحقق نتائج فعلية." },
      { tag: "البيانات والتعلم الآلي", title: "تحليل البيانات والتعلم الآلي", icon: "▦",
        desc: "حوّل بياناتك إلى قرارات. نطور نماذج وأنابيب بيانات ولوحات تحكم تمنحك رؤى واضحة وقابلة للتنفيذ." },
      { tag: "المواقع والذكاء الاصطناعي", title: "تطوير المواقع وتكامل الذكاء الاصطناعي", icon: "◈",
        desc: "هل تحتاج موقعاً احترافياً مدمجاً بالذكاء الاصطناعي؟ نصمم ونطور تجارب رقمية تتضمن ميزات ذكية منذ اليوم الأول." },
    ],
    services_link1: "← جميع الخدمات",
    services_link2: "← طلب استشارة",
    academy_eyebrow: "أكاديمية ZENTEXAI",
    academy_h2_line1: "تدريب احترافي",
    academy_h2_line2: "يبدأ بـ PMP",
    academy_p1: "تفتح الأكاديمية بتدريب التحضير لشهادة PMP — برنامج منظم وعملي مصمم لإعدادك للاجتياز. تُضاف دورات الذكاء الاصطناعي والتقنية في المرحلة التالية.",
    academy_p2: "سواء كنت تستعد لـ PMP أو تسعى لتطوير مهارات الذكاء الاصطناعي في فريقك، ستنمو الأكاديمية مع مسيرتك المهنية.",
    academy_btn1: "عرض الدورات",
    academy_btn2: "اسألنا",
    academy_courses: [
      { label: "التحضير لشهادة PMP", status: "متاح الآن" },
      { label: "الذكاء الاصطناعي لقادة الأعمال", status: "قريباً" },
      { label: "هندسة المطالبات التطبيقية", status: "قريباً" },
      { label: "أساسيات التعلم الآلي", status: "قريباً" },
    ],
    tools_eyebrow: "أدوات ZENTEXAI",
    tools_h2: "أدوات ذكاء اصطناعي خاصة — قيد التطوير",
    tools_sub: "نبني مجموعة من أدوات SaaS المدعومة بالذكاء الاصطناعي للتعليم والبناء وإدارة المشاريع. مصممة للمحترفين الذين يحتاجون أكثر من برمجيات عامة.",
    tools: [
      { title: "محاكي امتحان PMP", category: "التعليم",
        desc: "محاكاة امتحانات مؤقتة، بنوك أسئلة تكيفية، وتتبع الأداء — مصمم خصيصاً لمرشحي PMP." },
      { title: "ذكاء اصطناعي لمشاريع البناء", category: "البناء",
        desc: "أدوات ذكاء اصطناعي لمديري مشاريع البناء — الجدولة، تتبع التكاليف، تنبيهات المخاطر، وتقارير التقدم." },
      { title: "مخطط المشاريع بالذكاء الاصطناعي", category: "إدارة المشاريع",
        desc: "تخطيط مشاريع مدعوم بالذكاء الاصطناعي للفرق — تعريف النطاق، تفصيل المهام، وإنشاء الجداول الزمنية." },
    ],
    tools_link: "← اعرف أكثر عن أدواتنا",
    why_eyebrow: "لماذا ZENTEXAI",
    why_h2: "ما الذي يميّزنا",
    why_sub: "نحن شركة ذكاء اصطناعي بُنيت للمنطقة — لسنا مكتباً إقليمياً لشركة عالمية. هذا الفرق يظهر في طريقة عملنا.",
    benefits: [
      { title: "تسليم فعلي، لا تقارير استشارية",
        desc: "نبني وننشر — لا نكتفي بالنصح. كل مشاركة تنتهي بحل جاهز للعمل بين يديك." },
      { title: "خبرة متعمقة في المجال",
        desc: "يجمع فريقنا خبرة في هندسة الذكاء الاصطناعي وإدارة المشاريع والبناء والتعليم." },
      { title: "ثنائي اللغة بالتصميم",
        desc: "نعمل بالعربية والإنجليزية. حلولنا مصممة لسوق الشرق الأوسط، لا مترجمة إليه." },
      { title: "تسعير واضح، نطاق محدد",
        desc: "لا عقود مبهمة. كل مشروع يبدأ بنطاق محدد وجدول زمني وتسليمات واضحة." },
      { title: "دعم ما بعد التسليم",
        desc: "نبقى متاحين بعد الإطلاق — للتعديلات والتدريب وتوسيع ما يعمل." },
      { title: "ثلاثة محاور، شريك واحد",
        desc: "الخدمات والتدريب والأدوات تحت سقف واحد — حتى يتطور فريقك مع الحلول التي نبنيها." },
    ],
  },

  // ── Services ─────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "ما نقدمه",
    hero_h1: "خدمات الذكاء الاصطناعي",
    hero_sub: "حلول ذكاء اصطناعي متميزة مصممة لتسريع أعمالك. من الاستراتيجية حتى التنفيذ — نحقق النتائج.",
    cards: [
      { tag: "الاستراتيجية", title: "استشارات استراتيجية الذكاء الاصطناعي", icon: "◈",
        desc: "نساعد الشركات في تحديد خارطة طريق ذكاء اصطناعي واضحة وتنفيذها — من رصد الفرص إلى التخطيط للتطبيق." },
      { tag: "الأتمتة", title: "أتمتة العمليات", icon: "⟳",
        desc: "أتمتة المهام المتكررة وسير العمل المعقدة بوكلاء ذكاء اصطناعي. أتح لفريقك التفرغ للعمل الذي يستحق." },
      { tag: "النمو", title: "ذكاء اصطناعي لتوليد العملاء", icon: "◎",
        desc: "توليد عملاء مدعوم بالذكاء الاصطناعي مصمم لسوقك المستهدف. حدد العملاء المناسبين وأهّلهم وتواصل معهم على نطاق واسع." },
      { tag: "البناء المخصص", title: "حلول ذكاء اصطناعي مخصصة", icon: "◇",
        desc: "أنظمة ذكاء اصطناعي مصممة حول احتياجات عملك — من روبوتات المحادثة ومحركات التوصيات إلى التحليلات التنبؤية." },
      { tag: "البيانات", title: "تحليل البيانات والرؤى", icon: "▦",
        desc: "حوّل البيانات الخام إلى معلومات استراتيجية. نصمم لوحات تحكم ونماذج وتقارير تدفع قرارات أذكى." },
      { tag: "التكامل", title: "تكامل الذكاء الاصطناعي", icon: "⊕",
        desc: "أدمج قدرات الذكاء الاصطناعي في أدواتك ومنصاتك وسير عملك الحالية — بأقل تعطيل وأقصى أثر." },
    ],
    process_eyebrow: "طريقة عملنا",
    process_h2: "منهجيتنا",
    process: [
      { step: "01", title: "الاكتشاف", desc: "نبدأ بفهم أعمالك وأهدافك والتحديات التي تواجهها." },
      { step: "02", title: "الاستراتيجية", desc: "نصمم خارطة طريق ذكاء اصطناعي مخصصة وبنية الحل المناسبة." },
      { step: "03", title: "البناء", desc: "يقوم فريقنا ببناء واختبار وتحسين حلك بالذكاء الاصطناعي." },
      { step: "04", title: "التسليم", desc: "ننشر الحل، نُدرّب فريقك، ونبقى معك بعد الإطلاق." },
    ],
    cta_h2: "هل أنت مستعد لبناء شيء استثنائي؟",
    cta_p: "أخبرنا عن مشروعك. سنرد خلال 24 ساعة.",
    cta_btn1: "تواصل معنا",
    cta_btn2: "من نحن",
  },

  // ── Academy ──────────────────────────────────────────────────────────────────
  academy: {
    hero_eyebrow: "تعلّم وانمُ",
    hero_h1: "أكاديمية ZENTEXAI",
    hero_sub: "دورات احترافية مبنية لعصر الذكاء الاصطناعي. احصل على الشهادة، ابقَ في الطليعة، وقُد بثقة.",
    hero_btn1: "سجّل الآن",
    hero_btn2: "استعرض الدورات",
    features: [
      { title: "مدربون متخصصون", desc: "تعلّم من ممارسين لديهم خبرة فعلية في الذكاء الاصطناعي وإدارة المشاريع." },
      { title: "تعلّم مرن", desc: "وحدات بالوتيرة الذاتية مصممة للمهنيين المشغولين. تعلّم وفق جدولك." },
      { title: "مخرجات معتمدة", desc: "دورات متوافقة مع الشهادات المهنية بما فيها PMP." },
      { title: "محتوى إقليمي", desc: "محتوى مصمم للبيئة التجارية في الخليج ومنطقة الشرق الأوسط وشمال أفريقيا." },
    ],
    courses_eyebrow: "الدورات",
    courses_h2: "جميع الدورات",
    courses: [
      { title: "التحضير لشهادة PMP", tag: "إدارة المشاريع", status: "متاح الآن", duration: "8 أسابيع",
        desc: "تحضير شامل لامتحان PMP — وحدات منظمة وأسئلة تدريبية وإرشاد متخصص." },
      { title: "الذكاء الاصطناعي لقادة الأعمال", tag: "الذكاء الاصطناعي", status: "قريباً", duration: "4 أسابيع",
        desc: "افهم الذكاء الاصطناعي دون تعقيد. تعلّم تحديد الفرص وتقييم الأدوات وقيادة مبادرات الذكاء الاصطناعي." },
      { title: "إتقان هندسة المطالبات", tag: "مهارات الذكاء الاصطناعي", status: "قريباً", duration: "3 أسابيع",
        desc: "احترف العمل مع نماذج اللغة الكبيرة. تقنيات عملية لسير العمل التجاري الفعلي." },
      { title: "أساسيات التعلم الآلي", tag: "علم البيانات", status: "قريباً", duration: "6 أسابيع",
        desc: "من البيانات إلى النماذج — مقدمة عملية في التعلم الآلي للمهنيين." },
      { title: "أدوات الذكاء الاصطناعي للبناء", tag: "قطاع محدد", status: "قريباً", duration: "4 أسابيع",
        desc: "تدريب ذكاء اصطناعي متخصص للمهنيين في قطاع البناء — التخطيط والسلامة وإدارة المشاريع." },
      { title: "تقنيات التعليم والذكاء الاصطناعي", tag: "تقنية التعليم", status: "قريباً", duration: "3 أسابيع",
        desc: "كيف يعيد الذكاء الاصطناعي تشكيل التعليم — تصميم الدورات والتخصيص ومستقبل التعلم." },
    ],
    bottom_h2: "لست متأكداً من الدورة المناسبة لك؟",
    bottom_p: "يمكن لفريقنا مساعدتك في اختيار مسار التعلم الأنسب لأهدافك.",
    bottom_btn: "تحدث إلينا",
  },

  // ── Tools ─────────────────────────────────────────────────────────────────────
  tools: {
    hero_badge: "إطلاق قريب",
    hero_h1: "أدوات مدعومة بالذكاء الاصطناعي",
    hero_sub: "مجموعة أدوات SaaS ذكية للتعليم والبناء وإدارة المشاريع — مصممة لطريقة عمل المهنيين الفعلية.",
    tools: [
      { title: "محاكي امتحان PMP", category: "التعليم", icon: "◎",
        desc: "محاكي امتحانات تكيفي للتحضير لشهادة PMP. آلاف الأسئلة وجلسات موقوتة وتحليلات أداء متفصلة." } as unknown as ToolItem,
      { title: "مخطط المشاريع بالذكاء الاصطناعي", category: "إدارة المشاريع", icon: "◈",
        desc: "تخطيط مشاريع ذكي مدعوم بالذكاء الاصطناعي. من تحديد النطاق إلى توزيع الموارد — تخطيط أفضل ونتائج أذكى." } as unknown as ToolItem,
      { title: "مساعد البناء بالذكاء الاصطناعي", category: "البناء", icon: "◇",
        desc: "أدوات ذكاء اصطناعي لقطاع البناء — عمليات التدقيق الأمني، تحسين الجداول الزمنية، وتقارير المواقع بكل سهولة." } as unknown as ToolItem,
      { title: "منشئ الدورات الذكي", category: "تقنية التعليم", icon: "⊕",
        desc: "إنشاء وإدارة دورات تعليمية محسّنة بالذكاء الاصطناعي. هيكلة ذكية للمحتوى وإنشاء تقييمات ورؤى المتعلمين." } as unknown as ToolItem,
    ],
    waitlist_eyebrow: "وصول مبكر",
    waitlist_h2: "كن أول من يعلم",
    waitlist_p: "انضم إلى قائمة الانتظار واحصل على أولوية الوصول عند الإطلاق.",
    waitlist_btn: "انضم إلى قائمة الانتظار",
  },

  // ── About ─────────────────────────────────────────────────────────────────────
  about: {
    hero_eyebrow: "قصتنا",
    hero_h1: "من نحن",
    hero_sub: "نحن هنا لنجعل الذكاء الاصطناعي المتميز حقيقة واقعية — لا مجرد نظرية. للشركات في منطقة الشرق الأوسط المستعدة للقيادة.",
    mission_eyebrow: "رسالتنا",
    mission_h2_line1: "ذكاء اصطناعي",
    mission_h2_line2: "يحقق نتائج فعلية",
    mission_p1: "تأسست ZENTEXAI لجعل الذكاء الاصطناعي المتميز في متناول المهنيين والشركات في المنطقة. نجمع خدمات عالمية المستوى وتعليماً وأدوات تحت سقف واحد — مبنية لمن يرفض القبول بالمتوسط.",
    mission_p2: "نؤمن بأن الذكاء الاصطناعي ليس حكراً على شركات التكنولوجيا. كل قطاع — البناء والتعليم وإدارة المشاريع — يستحق أدوات ذكية مصممة لاحتياجاته الفعلية.",
    pillars: [
      { label: "خدمات الذكاء الاصطناعي", desc: "استشارات وأتمتة وبناء مخصص." },
      { label: "الأكاديمية", desc: "دورات احترافية وشهادات معتمدة." },
      { label: "الأدوات", desc: "أدوات SaaS للقطاعات الرئيسية." },
    ],
    values_eyebrow: "قيمنا",
    values_h2: "ما نؤمن به",
    values: [
      { title: "التميّز",
        desc: "نلتزم بأعلى المعايير في كل ما نبنيه — من وحدة واحدة حتى نظام ذكاء اصطناعي متكامل." },
      { title: "الابتكار",
        desc: "ندفع حدود ما هو ممكن ونستكشف باستمرار ما يمكن للذكاء الاصطناعي تقديمه لكل قطاع." },
      { title: "الأثر",
        desc: "نقيس نجاحنا بالنتائج الفعلية التي نحققها — لا بالمخرجات، بل بالأثر." },
    ],
    team_eyebrow: "الفريق",
    team_h2: "من يقف وراء ZENTEXAI",
    team_p: "فريق من متخصصي الذكاء الاصطناعي والمعلمين وخبراء القطاع. تفاصيل الفريق قادمة قريباً.",
    team_btn: "انضم إلينا",
  },

  // ── Blog ──────────────────────────────────────────────────────────────────────
  blog: {
    hero_eyebrow: "رؤى وتحليلات",
    hero_h1: "المدونة",
    hero_sub: "أفكار وأدلة عملية ورؤى من فريق ZENTEXAI.",
    featured_label: "مقالة مميزة",
    all_label: "جميع المقالات",
    coming_soon: "قريباً",
    content_note: "المحتوى قيد الإعداد. تفقّد الموقع لاحقاً.",
    featured: {
      id: "ai", tag: "ذكاء اصطناعي", readTime: "٨ دقائق قراءة",
      title: "مستقبل الذكاء الاصطناعي في إدارة المشاريع",
      desc: "كيف يعيد الذكاء الاصطناعي تشكيل طريقة التخطيط والتنفيذ والتسليم — وما يعنيه ذلك للجيل القادم من مديري المشاريع.",
    },
    posts: [
      { id: "academy", tag: "الأكاديمية", readTime: "٦ دقائق قراءة",
        title: "كيف تجتاز امتحان PMP في 2025",
        desc: "دليل عملي للتحضير لامتحان PMP بأدوات دراسة حديثة مدعومة بالذكاء الاصطناعي." },
      { id: "tools", tag: "الأدوات", readTime: "٥ دقائق قراءة",
        title: "أبرز أدوات الذكاء الاصطناعي لفرق البناء",
        desc: "من سلامة الموقع إلى تحسين الجداول — أدوات الذكاء الاصطناعي التي تجعل البناء أذكى." },
      { id: "services", tag: "الخدمات", readTime: "٧ دقائق قراءة",
        title: "لماذا تحتاج كل شركة إلى استراتيجية ذكاء اصطناعي",
        desc: "الشركات التي لا تمتلك استراتيجية ذكاء اصطناعي تتأخر بالفعل. إليك من أين تبدأ." },
      { id: "skills", tag: "مهارات الذكاء الاصطناعي", readTime: "٤ دقائق قراءة",
        title: "هندسة المطالبات: المهارة المهنية الجديدة",
        desc: "لماذا أصبحت معرفة كيفية العمل مع نماذج الذكاء الاصطناعي ضرورية كاستخدام جداول البيانات." },
    ],
  },

  // ── Login ─────────────────────────────────────────────────────────────────────
  login: {
    tagline: "تسجيل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    btn: "تسجيل الدخول",
    note: "نظام المصادقة قادم في إصدار قادم.",
    not_member: "لست عضواً؟",
    get_in_touch: "تواصل معنا",
  },

  // ── Contact ───────────────────────────────────────────────────────────────────
  contact: {
    hero_eyebrow: "تواصل معنا",
    hero_h1: "راسلنا",
    hero_sub: "هل لديك مشروع في ذهنك أو تريد معرفة المزيد؟ يسعدنا سماعك.",
    form_heading: "أرسل لنا رسالة",
    details: [
      { id: "email", label: "البريد الإلكتروني", value: "hello@zenetexai.com", href: "mailto:hello@zenetexai.com", icon: "✉" },
      { id: "whatsapp", label: "واتساب", value: "+966 00 000 0000", href: "https://wa.me/96600000000", icon: "◎" },
      { id: "response", label: "وقت الاستجابة", value: "خلال 24 ساعة", href: null, icon: "◷" },
    ],
    note: "لا يوجد أي إلزام. أخبرنا بتحديك وسنقترح مساراً واضحاً — دون ضغط أو مبالغة.",
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

const translations: Record<Lang, Translations> = { en, ar };
export default translations;
