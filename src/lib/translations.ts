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
    dashboard: string; logout: string;
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
    btn: string; signing_in: string;
    forgot_password: string; no_account: string; create_account: string;
  };
  contact: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    form_heading: string; details: ContactDetail[]; note: string;
  };
  auth: {
    signup: {
      tagline: string; first_name: string; last_name: string; email: string;
      password: string; confirm_password: string; password_hint: string;
      btn: string; btn_loading: string; have_account: string; sign_in: string;
    };
    forgotPassword: {
      tagline: string; sub: string; email: string; btn: string; btn_loading: string;
      success_title: string; success_sub: string; back_to_login: string;
    };
    resetPassword: {
      tagline: string; password: string; confirm_password: string;
      btn: string; btn_loading: string; success_title: string; success_sub: string;
      go_to_login: string; invalid_link_title: string; invalid_link_sub: string;
      request_new_link: string;
    };
    verifyEmail: {
      title: string; sub: string; sub_generic: string;
      resend_btn: string; resend_loading: string; resend_success: string;
      back_to_login: string;
    };
    dashboard: {
      welcome: string; role_label: string; logout: string;
      continue_learning: string; continue_cta: string;
      study_statistics: string; study_streak: string; total_study_time: string; learning_progress: string;
      days: string; minutes: string;
      completed_lessons: string; completed_modules: string; quiz_progress: string;
      my_courses: string; no_courses: string;
    };
    admin: {
      title: string; placeholder_note: string;
    };
    validation: {
      required: string; invalid_email: string; password_too_short: string;
      password_needs_uppercase: string; password_needs_number: string;
      passwords_dont_match: string;
    };
    errors: {
      generic: string; invalid_credentials: string; email_not_confirmed: string;
      email_taken: string; weak_password: string; rate_limited: string;
      user_not_found: string;
    };
  };
  courses: {
    dashboard: { eyebrow: string; heading: string; empty: string };
    detail: { lessons_label: string; empty: string; module_assessment_cta: string };
    lesson: {
      back_to_course: string; video_placeholder: string;
      mark_complete: string; marking: string; completed: string;
      checkpoint_label: string;
    };
    assessment: {
      submit: string; submitting: string; passed: string; failed: string; generic_error: string;
      retry: string; continue_learning: string; view_history: string;
    };
    notes: { title: string; placeholder: string; save: string; saving: string; saved: string };
    resources: { title: string };
    nav: { first_lesson: string; last_lesson: string };
    history: {
      title: string; back_to_quiz: string; back_to_history: string; empty: string;
      your_answer: string; no_answer: string; hotspot_answered: string;
    };
  };
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    home: "Home", services: "Services", academy: "Academy", tools: "Tools",
    about: "About", blog: "Blog", contact: "Contact", login: "Login",
    dashboard: "Dashboard", logout: "Log out",
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
      { label: "Academy", desc: "PMP Certification exam preparation" },
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
    academy_h2_line1: "PMP Certification",
    academy_h2_line2: "Exam Preparation",
    academy_p1: "The Academy is a complete PMP exam prep platform — structured lessons, a full practice question bank, timed exam simulations, and detailed performance analytics to get you exam-ready.",
    academy_p2: "Everything you need to prepare for the PMP exam in one place, tracked from your first lesson to your final practice score.",
    academy_btn1: "View the Course",
    academy_btn2: "Ask Us Anything",
    academy_courses: [
      { label: "PMP Certification Preparation", status: "Available" },
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
    hero_eyebrow: "PMP Certification Platform",
    hero_h1: "ZENTEXAI Academy",
    hero_sub: "Everything you need to prepare for the PMP exam — structured lessons, a full practice question bank, timed exam simulations, and progress tracking, all in one place.",
    hero_btn1: "Enroll Now",
    hero_btn2: "View the Course",
    features: [
      { title: "Expert-Built Curriculum", desc: "Lessons and practice questions built around the current PMP Examination Content Outline." },
      { title: "Flexible Learning", desc: "Self-paced modules designed for busy professionals. Learn on your schedule." },
      { title: "Full Practice Engine", desc: "A large question bank, filterable practice sessions, and timed exam simulations." },
      { title: "MENA-Focused", desc: "Bilingual content designed for the Gulf and MENA business landscape." },
    ],
    courses_eyebrow: "Certification",
    courses_h2: "PMP Certification Course",
    courses: [
      { title: "PMP Certification Prep", tag: "Project Management", status: "Available", duration: "8 weeks",
        desc: "Comprehensive preparation for the PMP exam — structured modules, a full practice question bank, timed exam simulations, and expert guidance." },
    ],
    bottom_h2: "Ready to start preparing for the PMP exam?",
    bottom_p: "Our team can walk you through the course and answer any questions before you enroll.",
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
    btn: "Sign In", signing_in: "Signing in...",
    forgot_password: "Forgot password?",
    no_account: "Don't have an account?",
    create_account: "Create one",
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

  // ── Auth (Sprint 2) ──────────────────────────────────────────────────────────
  auth: {
    signup: {
      tagline: "Create your account",
      first_name: "First name", last_name: "Last name",
      email: "Email", password: "Password", confirm_password: "Confirm password",
      password_hint: "At least 8 characters, one uppercase letter and one number.",
      btn: "Create account", btn_loading: "Creating account...",
      have_account: "Already have an account?", sign_in: "Sign in",
    },
    forgotPassword: {
      tagline: "Reset your password",
      sub: "Enter your email and we'll send you a link to reset your password.",
      email: "Email",
      btn: "Send reset link", btn_loading: "Sending...",
      success_title: "Check your email",
      success_sub: "We've sent a password reset link. Follow it to choose a new password.",
      back_to_login: "Back to login",
    },
    resetPassword: {
      tagline: "Choose a new password",
      password: "New password", confirm_password: "Confirm new password",
      btn: "Update password", btn_loading: "Updating...",
      success_title: "Password updated",
      success_sub: "Your password has been changed. You can now sign in.",
      go_to_login: "Go to login",
      invalid_link_title: "This link is invalid or expired",
      invalid_link_sub: "Request a new password reset link and try again.",
      request_new_link: "Request new link",
    },
    verifyEmail: {
      title: "Check your inbox",
      sub: "We've sent a confirmation link to",
      sub_generic: "We've sent a confirmation link to your email.",
      resend_btn: "Resend email", resend_loading: "Sending...",
      resend_success: "Verification email sent again.",
      back_to_login: "Back to login",
    },
    dashboard: {
      welcome: "Welcome back", role_label: "Role", logout: "Log out",
      continue_learning: "Continue Learning", continue_cta: "Resume lesson",
      study_statistics: "Study Statistics", study_streak: "Study Streak",
      total_study_time: "Total Study Time", learning_progress: "Learning Progress",
      days: "days", minutes: "min",
      completed_lessons: "Completed Lessons", completed_modules: "Completed Modules", quiz_progress: "Quiz Progress",
      my_courses: "My Courses", no_courses: "No published courses yet. Check back soon.",
    },
    admin: {
      title: "Admin",
      placeholder_note: "This is a placeholder admin area, visible to admins only. Management tools will be added in future sprints.",
    },
    validation: {
      required: "This field is required.",
      invalid_email: "Enter a valid email address.",
      password_too_short: "Password must be at least 8 characters.",
      password_needs_uppercase: "Password must include an uppercase letter.",
      password_needs_number: "Password must include a number.",
      passwords_dont_match: "Passwords don't match.",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      invalid_credentials: "Incorrect email or password.",
      email_not_confirmed: "Please verify your email before signing in.",
      email_taken: "An account with this email already exists.",
      weak_password: "Please choose a stronger password.",
      rate_limited: "Too many attempts. Please wait a moment and try again.",
      user_not_found: "No account found with this email.",
    },
  },

  // ── Courses (Sprint 3) ───────────────────────────────────────────────────────
  courses: {
    dashboard: {
      eyebrow: "Academy",
      heading: "Your Courses",
      empty: "No courses are available yet. Check back soon.",
    },
    detail: {
      lessons_label: "lessons completed",
      empty: "This course doesn't have any published modules yet.",
      module_assessment_cta: "Take Module Assessment",
    },
    lesson: {
      back_to_course: "Back to course",
      video_placeholder: "Video coming soon",
      mark_complete: "Mark as complete",
      marking: "Saving...",
      completed: "Completed",
      checkpoint_label: "Learning Checkpoint",
    },
    assessment: {
      submit: "Submit",
      submitting: "Submitting...",
      passed: "You passed!",
      failed: "Not quite — review the explanations below and try again later.",
      generic_error: "Something went wrong submitting your answers. Please try again.",
      retry: "Retry",
      continue_learning: "Continue Learning",
      view_history: "View past attempts",
    },
    notes: {
      title: "My Notes",
      placeholder: "Write a personal note for this lesson...",
      save: "Save note",
      saving: "Saving...",
      saved: "Saved",
    },
    resources: {
      title: "Resources",
    },
    nav: {
      first_lesson: "This is the first lesson",
      last_lesson: "This is the last lesson",
    },
    history: {
      title: "Quiz History",
      back_to_quiz: "Back to quiz",
      back_to_history: "Back to history",
      empty: "No attempts yet.",
      your_answer: "Your answer",
      no_answer: "No answer submitted",
      hotspot_answered: "You clicked on the image",
    },
  },
};

// ─── Arabic ───────────────────────────────────────────────────────────────────

const ar: Translations = {
  nav: {
    home: "الرئيسية", services: "الخدمات", academy: "الأكاديمية", tools: "الأدوات",
    about: "من نحن", blog: "المدونة", contact: "تواصل معنا", login: "تسجيل الدخول",
    dashboard: "لوحة التحكم", logout: "تسجيل الخروج",
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
    academy_h2_line1: "التحضير لشهادة",
    academy_h2_line2: "PMP",
    academy_p1: "الأكاديمية منصة متكاملة للتحضير لامتحان PMP — دروس منظمة، بنك أسئلة تدريبية كامل، محاكاة امتحانات مؤقتة، وتحليلات أداء تفصيلية لإعدادك للاجتياز.",
    academy_p2: "كل ما تحتاجه للتحضير لامتحان PMP في مكان واحد، من درسك الأول حتى نتيجتك التدريبية الأخيرة.",
    academy_btn1: "عرض الدورة",
    academy_btn2: "اسألنا",
    academy_courses: [
      { label: "التحضير لشهادة PMP", status: "متاح الآن" },
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
    hero_eyebrow: "منصة التحضير لشهادة PMP",
    hero_h1: "أكاديمية ZENTEXAI",
    hero_sub: "كل ما تحتاجه للتحضير لامتحان PMP — دروس منظمة، بنك أسئلة تدريبية كامل، محاكاة امتحانات مؤقتة، وتتبع للتقدم، كل ذلك في مكان واحد.",
    hero_btn1: "سجّل الآن",
    hero_btn2: "عرض الدورة",
    features: [
      { title: "منهج مبني بعناية", desc: "دروس وأسئلة تدريبية مبنية حول مخطط محتوى امتحان PMP الحالي." },
      { title: "تعلّم مرن", desc: "وحدات بالوتيرة الذاتية مصممة للمهنيين المشغولين. تعلّم وفق جدولك." },
      { title: "محرك تدريب متكامل", desc: "بنك أسئلة كبير، جلسات تدريب قابلة للتصفية، ومحاكاة امتحانات مؤقتة." },
      { title: "محتوى إقليمي", desc: "محتوى ثنائي اللغة مصمم للبيئة التجارية في الخليج ومنطقة الشرق الأوسط وشمال أفريقيا." },
    ],
    courses_eyebrow: "الشهادة",
    courses_h2: "دورة التحضير لشهادة PMP",
    courses: [
      { title: "التحضير لشهادة PMP", tag: "إدارة المشاريع", status: "متاح الآن", duration: "8 أسابيع",
        desc: "تحضير شامل لامتحان PMP — وحدات منظمة، بنك أسئلة تدريبية كامل، محاكاة امتحانات مؤقتة، وإرشاد متخصص." },
    ],
    bottom_h2: "هل أنت مستعد للبدء بالتحضير لامتحان PMP؟",
    bottom_p: "يمكن لفريقنا شرح الدورة والإجابة عن أي استفسار قبل التسجيل.",
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
    tagline: "سجّل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    btn: "تسجيل الدخول", signing_in: "جارٍ تسجيل الدخول...",
    forgot_password: "نسيت كلمة المرور؟",
    no_account: "ليس لديك حساب؟",
    create_account: "أنشئ حساباً",
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

  // ── Auth (Sprint 2) ──────────────────────────────────────────────────────────
  auth: {
    signup: {
      tagline: "أنشئ حسابك",
      first_name: "الاسم الأول", last_name: "اسم العائلة",
      email: "البريد الإلكتروني", password: "كلمة المرور", confirm_password: "تأكيد كلمة المرور",
      password_hint: "8 أحرف على الأقل، مع حرف كبير ورقم واحد.",
      btn: "إنشاء حساب", btn_loading: "جارٍ إنشاء الحساب...",
      have_account: "لديك حساب بالفعل؟", sign_in: "تسجيل الدخول",
    },
    forgotPassword: {
      tagline: "إعادة تعيين كلمة المرور",
      sub: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
      email: "البريد الإلكتروني",
      btn: "إرسال رابط إعادة التعيين", btn_loading: "جارٍ الإرسال...",
      success_title: "تحقق من بريدك الإلكتروني",
      success_sub: "أرسلنا رابط إعادة تعيين كلمة المرور. اتبع الرابط لاختيار كلمة مرور جديدة.",
      back_to_login: "العودة لتسجيل الدخول",
    },
    resetPassword: {
      tagline: "اختر كلمة مرور جديدة",
      password: "كلمة المرور الجديدة", confirm_password: "تأكيد كلمة المرور الجديدة",
      btn: "تحديث كلمة المرور", btn_loading: "جارٍ التحديث...",
      success_title: "تم تحديث كلمة المرور",
      success_sub: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
      go_to_login: "الذهاب لتسجيل الدخول",
      invalid_link_title: "هذا الرابط غير صالح أو منتهي الصلاحية",
      invalid_link_sub: "اطلب رابط إعادة تعيين جديد وحاول مرة أخرى.",
      request_new_link: "طلب رابط جديد",
    },
    verifyEmail: {
      title: "تحقق من بريدك الوارد",
      sub: "أرسلنا رابط تأكيد إلى",
      sub_generic: "أرسلنا رابط تأكيد إلى بريدك الإلكتروني.",
      resend_btn: "إعادة إرسال البريد", resend_loading: "جارٍ الإرسال...",
      resend_success: "تم إرسال بريد التحقق مرة أخرى.",
      back_to_login: "العودة لتسجيل الدخول",
    },
    dashboard: {
      welcome: "مرحباً بعودتك", role_label: "الدور", logout: "تسجيل الخروج",
      continue_learning: "متابعة التعلم", continue_cta: "استئناف الدرس",
      study_statistics: "إحصائيات الدراسة", study_streak: "سلسلة أيام الدراسة",
      total_study_time: "إجمالي وقت الدراسة", learning_progress: "تقدم التعلم",
      days: "أيام", minutes: "دقيقة",
      completed_lessons: "الدروس المكتملة", completed_modules: "الوحدات المكتملة", quiz_progress: "تقدم الاختبارات",
      my_courses: "دوراتي", no_courses: "لا توجد دورات منشورة بعد. تحقق مرة أخرى قريباً.",
    },
    admin: {
      title: "الإدارة",
      placeholder_note: "هذه صفحة إدارة مبدئية، مخصصة للمشرفين فقط. ستتم إضافة أدوات الإدارة في مراحل قادمة.",
    },
    validation: {
      required: "هذا الحقل مطلوب.",
      invalid_email: "أدخل بريداً إلكترونياً صالحاً.",
      password_too_short: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
      password_needs_uppercase: "يجب أن تحتوي كلمة المرور على حرف كبير.",
      password_needs_number: "يجب أن تحتوي كلمة المرور على رقم.",
      passwords_dont_match: "كلمتا المرور غير متطابقتين.",
    },
    errors: {
      generic: "حدث خطأ ما. حاول مرة أخرى.",
      invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      email_not_confirmed: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.",
      email_taken: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.",
      weak_password: "يرجى اختيار كلمة مرور أقوى.",
      rate_limited: "محاولات كثيرة جداً. يرجى الانتظار قليلاً والمحاولة مرة أخرى.",
      user_not_found: "لا يوجد حساب مسجل بهذا البريد الإلكتروني.",
    },
  },

  // ── Courses (Sprint 3) ───────────────────────────────────────────────────────
  courses: {
    dashboard: {
      eyebrow: "الأكاديمية",
      heading: "دوراتك",
      empty: "لا توجد دورات متاحة حالياً. تحقق مرة أخرى قريباً.",
    },
    detail: {
      lessons_label: "درساً مكتملاً",
      empty: "لا تحتوي هذه الدورة على وحدات منشورة بعد.",
      module_assessment_cta: "بدء تقييم الوحدة",
    },
    lesson: {
      back_to_course: "العودة إلى الدورة",
      video_placeholder: "الفيديو قادم قريباً",
      mark_complete: "وضع علامة مكتمل",
      marking: "جارٍ الحفظ...",
      completed: "مكتمل",
      checkpoint_label: "نقطة تحقق تعليمية",
    },
    assessment: {
      submit: "إرسال",
      submitting: "جارٍ الإرسال...",
      passed: "لقد نجحت!",
      failed: "ليس تماماً — راجع الشروحات أدناه وحاول مرة أخرى لاحقاً.",
      generic_error: "حدث خطأ أثناء إرسال إجاباتك. حاول مرة أخرى.",
      retry: "إعادة المحاولة",
      continue_learning: "متابعة التعلم",
      view_history: "عرض المحاولات السابقة",
    },
    notes: {
      title: "ملاحظاتي",
      placeholder: "اكتب ملاحظة شخصية لهذا الدرس...",
      save: "حفظ الملاحظة",
      saving: "جارٍ الحفظ...",
      saved: "تم الحفظ",
    },
    resources: {
      title: "الموارد",
    },
    nav: {
      first_lesson: "هذا هو الدرس الأول",
      last_lesson: "هذا هو الدرس الأخير",
    },
    history: {
      title: "سجل الاختبارات",
      back_to_quiz: "العودة إلى الاختبار",
      back_to_history: "العودة إلى السجل",
      empty: "لا توجد محاولات بعد.",
      your_answer: "إجابتك",
      no_answer: "لم يتم إرسال إجابة",
      hotspot_answered: "لقد نقرت على الصورة",
    },
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

const translations: Record<Lang, Translations> = { en, ar };
export default translations;
