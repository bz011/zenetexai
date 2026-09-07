export type Lang = "en" | "ar";

// ─── Shared types ─────────────────────────────────────────────────────────────



interface ProcessStep { step: string; title: string; desc: string }
interface ValueItem { title: string; desc: string }
interface FeatureItem { title: string; desc: string }
interface BenefitItem { title: string; desc: string }
interface ContactDetail { id: string; label: string; value: string; href: string | null; icon: string }
interface ServiceCategory { id: string; title: string; desc: string; examples: string[] }
interface AcademyProgram { id: string; title: string; tag: string; status: string; duration?: string; desc: string }
interface FounderInfo { name: string; titles: string[]; bio: string }
interface InquiryType { value: string; label: string }

// ─── Translation shape ────────────────────────────────────────────────────────

export interface Translations {
  nav: {
    home: string; services: string; academy: string; resources: string;
    about: string; contact: string; login: string;
    dashboard: string; logout: string;
  };
  academyNav: {
    brand: string; courses: string; practice: string; mockExam: string; enroll: string;
  };
  assessment: {
    langToggle: string;
    runner: {
      section: string; question: string; of: string;
      flagged: string; flagForReview: string;
      previous: string; next: string; finishSection: string;
      submitExam: string; submitPractice: string; submitting: string;
      submitConfirmTitle: string; submitConfirmBody: string; keepGoing: string; submitAnyway: string;
      saveWarning: string; noQuestionAvailable: string;
    };
    navigator: {
      questions: string; sectionQuestions: string; answered: string; unanswered: string; flagged: string; sealedNote: string;
    };
    breakScreen: {
      scheduledBreak: string; clockPaused: string; resumeNow: string; resuming: string;
    };
    sectionComplete: {
      sectionComplete: string; takeBreakOrContinue: string; continueToSection: string;
      breakBody: string; continueBody: string; startBreak: string; continueWithoutBreak: string; pleaseWait: string;
    };
    results: {
      score: string; correct: string; incorrect: string; unanswered: string; timeExpired: string;
      timeSpent: string; avgPerQuestion: string; flaggedCount: string;
      byDomain: string; byApproach: string; byDifficulty: string; byQuestionType: string; byTopic: string;
      noPmiPassingScore: string;
      newMockExam: string; newPractice: string; retakeSameExam: string; startNewExam: string; viewHistory: string; backToResults: string;
    };
    review: {
      all: string; incorrect: string; correct: string; unanswered: string; flagged: string;
      noQuestionsMatch: string; selectQuestion: string;
      yourAnswer: string; correctAnswer: string; explanation: string; keyConcept: string; examTip: string; commonTrap: string;
      whyWrong: string; previousQuestion: string; nextQuestion: string; backToGrid: string; loading: string;
    };
    history: {
      title: string; attempt: string; retake: string; noAttemptsYet: string; startPrompt: string;
      resume: string; results: string; comparePerformance: string; previousScore: string; currentScore: string;
    };
  };
  footer: { tagline: string; rights: string };
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
    inquiry_type: string;
    message: string; message_placeholder: string; submit: string; submitting: string;
    success_title: string; success_sub: string; send_another: string;
  };
  home: {
    core_services_eyebrow: string; core_services_h2: string; core_services_sub: string; core_services_link: string;
    why_eyebrow: string; why_h2: string; why_sub: string;
    benefits: BenefitItem[];
    featured_eyebrow: string; featured_h2_line1: string; featured_h2_line2: string;
    featured_p1: string; featured_p2: string; featured_features: string[];
    featured_btn1: string; featured_btn2: string;
    founder_eyebrow: string; founder_h2: string; founder_summary: string; founder_btn: string;
    articles_eyebrow: string; articles_h2: string; articles_sub: string;
    articles_empty: string; articles_view_all: string;
  };
  services: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    categories: ServiceCategory[];
    process_eyebrow: string; process_h2: string;
    process: ProcessStep[];
    cta_h2: string; cta_p: string; cta_btn1: string; cta_btn2: string;
  };
  academy: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    hero_btn1: string; hero_btn2: string;
    features: FeatureItem[];
    programs_eyebrow: string; programs_h2: string;
    programs: AcademyProgram[];
    bottom_h2: string; bottom_p: string; bottom_btn: string;
  };
  about: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    mission_eyebrow: string; mission_h2_line1: string; mission_h2_line2: string;
    mission_p1: string; mission_p2: string;
    vision_eyebrow: string; vision_h2: string; vision_p: string;
    values_eyebrow: string; values_h2: string;
    values: ValueItem[];
    founder_eyebrow: string; founder_h2: string;
    founder: FounderInfo;
    cta_h2: string; cta_p: string; cta_btn: string;
  };
  resources: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    blog_title: string; blog_desc: string;
    insights_title: string; insights_desc: string;
    free_title: string; free_desc: string;
    articles_h2: string; articles_empty: string; view_all: string;
  };
  blog: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
  };
  login: {
    tagline: string; email: string; password: string;
    btn: string; signing_in: string;
    forgot_password: string; no_account: string; create_account: string;
  };
  contact: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string;
    form_heading: string; inquiry_types: InquiryType[]; details: ContactDetail[]; note: string;
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
    workspace: {
      curriculum_heading: string; progress_label: string;
      view_curriculum: string; close_curriculum: string; duration_minutes_label: string;
    };
  };
  commerce: {
    storefront: { eyebrow: string; heading: string; sub: string; empty: string };
    card: {
      view_details: string; enroll_free: string; enrolling: string; continue_learning: string;
      owned_badge: string; opening_soon: string; access_duration: string; free_badge: string;
      launch_offer_badge: string; buy_now: string; redirecting_to_payment: string;
    };
    product: {
      overview_heading: string; curriculum_heading: string; curriculum_empty: string;
      included_heading: string; pricing_heading: string; regular_price_label: string;
      promo_ends_label: string; capability_course: string; capability_practice: string;
      capability_mock_exam: string; not_found: string;
      login_prompt: string; login_cta: string; signup_cta: string;
    };
    locked: {
      course_title: string; course_body: string; course_cta: string;
      simulator_title: string; simulator_body: string; simulator_cta: string;
    };
    errors: { generic: string; already_owned: string; checkout_unavailable: string; not_payable: string; product_unavailable: string; rate_limited: string };
    dashboard: {
      owned_heading: string; empty: string; browse_courses: string; expires_label: string;
      open_course: string; open_practice: string; open_mock_exam: string;
    };
    checkout: {
      success_heading: string; success_body: string; access_until_label: string;
      pending_heading: string; pending_body: string; refresh: string;
      failed_heading: string; failed_body: string;
      cancelled_heading: string; cancelled_body: string;
      not_found_heading: string; not_found_body: string;
      go_to_practice: string; go_to_mock_exam: string; back_to_product: string; try_again: string;
    };
  };
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    home: "Home", services: "Services", academy: "Academy", resources: "Resources",
    about: "About", contact: "Contact", login: "Login",
    dashboard: "Dashboard", logout: "Log out",
  },
  academyNav: {
    brand: "ZentexAI Academy", courses: "Courses", practice: "Practice", mockExam: "Mock Exam", enroll: "Enroll",
  },
  assessment: {
    langToggle: "Switch language",
    runner: {
      section: "Section", question: "Question", of: "of",
      flagged: "Flagged for review", flagForReview: "Flag for review",
      previous: "Previous", next: "Next", finishSection: "Finish Section",
      submitExam: "Submit Exam", submitPractice: "Submit Practice", submitting: "Submitting...",
      submitConfirmTitle: "Submit with unanswered questions?", submitConfirmBody: "You have {count} unanswered question(s). Unanswered questions count as incorrect.",
      keepGoing: "Keep going", submitAnyway: "Submit anyway",
      saveWarning: "Your last answer may not have saved - check your connection.", noQuestionAvailable: "This question is no longer available. Use the navigator to continue with another question.",
    },
    navigator: {
      questions: "Questions", sectionQuestions: "Section {n} Questions", answered: "Answered", unanswered: "Unanswered", flagged: "Flagged",
      sealedNote: "Completed sections are sealed and cannot be reviewed again.",
    },
    breakScreen: {
      scheduledBreak: "Scheduled Break {n}", clockPaused: "Your exam clock is paused. Time not used on this break is returned to your exam. The exam resumes automatically when the break ends.",
      resumeNow: "Resume Exam Now", resuming: "Resuming...",
    },
    sectionComplete: {
      sectionComplete: "Section {n} Complete", takeBreakOrContinue: "Take a break, or continue", continueToSection: "Continue to Section {n}",
      breakBody: "You've reached a scheduled break point. Once you choose, Section {n} is sealed and cannot be reviewed again.",
      continueBody: "Section {n} is now sealed and cannot be reviewed again. Section {next} begins next.",
      startBreak: "Start {n}-Minute Break", continueWithoutBreak: "Continue Without Break to Section {n}", pleaseWait: "Please wait...",
    },
    results: {
      score: "Score", correct: "correct", incorrect: "incorrect", unanswered: "unanswered", timeExpired: "time expired",
      timeSpent: "Time spent", avgPerQuestion: "Avg. per question", flaggedCount: "Flagged",
      byDomain: "By Domain", byApproach: "By Approach", byDifficulty: "By Difficulty", byQuestionType: "By Question Type", byTopic: "By Topic",
      noPmiPassingScore: "PMI does not publish a numeric passing score for the real PMP exam - this percentage is provided for self-assessment only.",
      newMockExam: "New Mock Exam", newPractice: "New Practice Session", retakeSameExam: "Retake Same Exam", startNewExam: "Start New Exam", viewHistory: "View History", backToResults: "Back to Results",
    },
    review: {
      all: "All", incorrect: "Incorrect", correct: "Correct", unanswered: "Unanswered", flagged: "Flagged",
      noQuestionsMatch: "No questions match this filter.", selectQuestion: "Select a question to review it in detail.",
      yourAnswer: "Your Answer", correctAnswer: "Correct Answer", explanation: "Explanation", keyConcept: "Key Concept", examTip: "Exam Tip", commonTrap: "Common Trap",
      whyWrong: "Why this is wrong", previousQuestion: "← Previous", nextQuestion: "Next →", backToGrid: "← Back to list", loading: "Loading...",
    },
    history: {
      title: "History", attempt: "Attempt", retake: "Retake", noAttemptsYet: "No attempts yet", startPrompt: "Start one to see your history and scores here.",
      resume: "Resume", results: "Results", comparePerformance: "Performance Comparison", previousScore: "Previous score", currentScore: "Current score",
    },
  },
  footer: {
    tagline: "AI solutions, project management consulting, and professional learning — for the MENA region.",
    rights: "All rights reserved.",
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
    badge: "AI Solutions · Consulting · Professional Learning",
    headline1: "Practical AI.",
    headline2: "Real Project Results.",
    sub: "ZentexAI helps organizations apply AI effectively and strengthen how they deliver projects — through AI solutions, hands-on consulting, and professional learning programs, including our flagship PMP Mastery Program.",
    cta_primary: "Talk to Our Team",
    cta_secondary: "Explore Services",
    region_note: "Serving organizations and professionals across Saudi Arabia and the wider MENA region",
  },
  cta: {
    badge: "Get in Touch",
    headline: "Let's Work Together",
    sub: "Tell us about your organization and what you're trying to solve. We'll come back with a clear proposal — no pressure.",
  },
  form: {
    name: "Full Name", name_placeholder: "Your name",
    email: "Email", email_placeholder: "you@company.com",
    company: "Company", company_placeholder: "Your company name", company_optional: "(optional)",
    inquiry_type: "What can we help with?",
    message: "Message", message_placeholder: "Describe your project or what you need help with...",
    submit: "Send Message", submitting: "Sending…",
    success_title: "Message Received",
    success_sub: "Thank you for reaching out. A member of our team will be in touch within 24 hours.",
    send_another: "Send another message",
  },

  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    core_services_eyebrow: "What We Do",
    core_services_h2: "Core Services",
    core_services_sub: "Three disciplines, one team: practical AI, sound project delivery, and the professional learning to support both.",
    core_services_link: "Explore all services →",

    why_eyebrow: "Why ZentexAI",
    why_h2: "What Makes Us Different",
    why_sub: "We combine AI engineering, project management expertise, and a bias toward real delivery — not just recommendations.",
    benefits: [
      { title: "Real Delivery, Not Just Reports",
        desc: "We build and implement — not just advise. Every engagement ends with something working in your hands." },
      { title: "Project Management Expertise",
        desc: "Our approach to AI adoption is grounded in real project management discipline, not just technical enthusiasm." },
      { title: "Bilingual by Design",
        desc: "We work in both Arabic and English. Our solutions are built for the MENA market, not translated for it." },
      { title: "Clear Scope, Clear Pricing",
        desc: "No vague retainers. Every engagement starts with a defined scope, timeline, and deliverable." },
      { title: "Responsible AI Adoption",
        desc: "We help you adopt AI in ways that are governable and sustainable — not just fast." },
      { title: "One Partner, Multiple Disciplines",
        desc: "AI solutions, consulting, and professional learning under one roof, so your team grows alongside what we build." },
    ],

    featured_eyebrow: "Featured Program",
    featured_h2_line1: "PMP Mastery Program",
    featured_h2_line2: "Our Flagship Product",
    featured_p1: "A complete PMP exam preparation experience — structured lessons, a full practice question bank, timed exam simulations, and progress tracking, built by a PMP-certified team.",
    featured_p2: "It's the first of several professional learning programs we're building at ZentexAI.",
    featured_features: [
      "Structured lessons aligned to the PMP Examination Content Outline",
      "Full practice question bank with the PMP Simulator",
      "Timed, exam-style practice sessions",
      "Progress tracking from your first lesson to your last practice score",
    ],
    featured_btn1: "Enroll Now",
    featured_btn2: "View the Program",

    founder_eyebrow: "Leadership",
    founder_h2: "Meet the Founder",
    founder_summary: "ZentexAI was founded by Zaid Al-Badareen, Founder & CEO — an Electrical Engineer, PMP® certified project management professional, and holder of a Master of Science (MSc) in Artificial Intelligence.",
    founder_btn: "Read the full story →",

    articles_eyebrow: "Resources",
    articles_h2: "Latest Articles",
    articles_sub: "Practical insights on AI adoption and project management.",
    articles_empty: "We're preparing our first articles. Check back soon.",
    articles_view_all: "View all articles →",
  },

  // ── Services ────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "What We Offer",
    hero_h1: "Services",
    hero_sub: "AI solutions, AI consulting, and project management consulting — built to produce real outcomes, not just recommendations.",
    categories: [
      {
        id: "ai-solutions",
        title: "AI Solutions",
        desc: "Practical AI systems built to do real work inside your organization.",
        examples: ["AI Agents", "Workflow Automation", "Business Chatbots", "Knowledge Assistants", "Custom AI Applications"],
      },
      {
        id: "ai-consulting",
        title: "AI Consulting",
        desc: "Clear guidance on where AI fits your organization, and how to adopt it responsibly.",
        examples: ["AI Readiness Assessment", "AI Strategy", "AI Adoption", "Responsible AI", "AI Governance"],
      },
      {
        id: "pm-consulting",
        title: "Project Management Consulting",
        desc: "Hands-on project delivery expertise — from setting up a PMO to recovering a troubled project.",
        examples: ["PMO Setup", "Agile Transformation", "Hybrid Delivery", "Project Recovery", "Risk Management"],
      },
    ],
    process_eyebrow: "How We Work",
    process_h2: "Our Process",
    process: [
      { step: "01", title: "Discovery", desc: "We start by understanding your organization, goals, and constraints." },
      { step: "02", title: "Strategy", desc: "We design an approach and scope suited to your actual situation." },
      { step: "03", title: "Build", desc: "Our team implements, tests, and refines the solution or engagement." },
      { step: "04", title: "Deliver", desc: "We hand over what was agreed, support your team, and stay available after launch." },
    ],
    cta_h2: "Have a project in mind?",
    cta_p: "Tell us about it. We'll respond within 24 hours.",
    cta_btn1: "Contact Us",
    cta_btn2: "About Us",
  },

  // ── Academy ─────────────────────────────────────────────────────────────────
  academy: {
    hero_eyebrow: "Professional Learning",
    hero_h1: "ZentexAI Academy",
    hero_sub: "Our flagship PMP Mastery Program, the PMP Simulator, and future professional programs — all in one place.",
    hero_btn1: "Enroll Now",
    hero_btn2: "View the Program",
    features: [
      { title: "Expert-Built Curriculum", desc: "Lessons and practice questions built around the current PMP Examination Content Outline." },
      { title: "Flexible Learning", desc: "Self-paced modules designed for busy professionals. Learn on your schedule." },
      { title: "Full Practice Engine", desc: "A large question bank, filterable practice sessions, and timed exam simulations." },
      { title: "MENA-Focused", desc: "Bilingual content designed for the Gulf and MENA business landscape." },
    ],
    programs_eyebrow: "Programs",
    programs_h2: "What's Available",
    programs: [
      {
        id: "pmp-mastery", title: "PMP Mastery Program", tag: "Project Management", status: "Available", duration: "8 weeks",
        desc: "Comprehensive preparation for the PMP exam — structured modules, a full practice question bank, timed exam simulations, and expert guidance.",
      },
      {
        id: "pmp-simulator", title: "PMP Simulator", tag: "Exam Practice", status: "Available",
        desc: "Practice with real exam-style questions from the full PMP question bank — filter by domain, approach, or difficulty, timed or untimed, with instant scoring and review.",
      },
      {
        id: "future-programs", title: "Future Professional Programs", tag: "Coming Soon", status: "In Development",
        desc: "We're developing additional certification and professional-skills programs. Reach out if you'd like to be notified when new programs launch.",
      },
    ],
    bottom_h2: "Ready to start preparing for the PMP exam?",
    bottom_p: "Our team can walk you through the program and answer any questions before you enroll.",
    bottom_btn: "Talk to Us",
  },

  // ── About ────────────────────────────────────────────────────────────────────
  about: {
    hero_eyebrow: "Our Story",
    hero_h1: "About ZentexAI",
    hero_sub: "An AI solutions, project management consulting, and professional learning company — built to deliver, not just advise.",
    mission_eyebrow: "Mission",
    mission_h2_line1: "Expertise that",
    mission_h2_line2: "actually delivers",
    mission_p1: "ZentexAI exists to help organizations apply AI effectively and strengthen how they deliver projects — combining AI solutions, consulting, and professional learning under one roof.",
    mission_p2: "We believe good AI adoption and good project management share the same foundation: clear thinking, realistic scope, and follow-through. That's what we build for our clients and teach through our programs.",
    vision_eyebrow: "Vision",
    vision_h2: "Where We're Headed",
    vision_p: "We're building ZentexAI into a company organizations turn to for AI solutions, project management consulting, and professional learning — starting with the PMP Mastery Program and expanding as we grow.",
    values_eyebrow: "Values",
    values_h2: "What We Stand For",
    values: [
      { title: "Excellence",
        desc: "We hold our work to a high standard, whether it's a single AI agent or a full project recovery plan." },
      { title: "Practicality",
        desc: "We favor solutions that work in practice over ideas that only work in theory." },
      { title: "Integrity",
        desc: "We're direct about what AI and good project management can — and can't — do for you." },
    ],
    founder_eyebrow: "Leadership",
    founder_h2: "Meet the Founder",
    founder: {
      name: "Zaid Al-Badareen",
      titles: ["Founder & CEO, ZentexAI", "Electrical Engineer", "PMP® Certified Project Management Professional", "Master of Science (MSc) in Artificial Intelligence"],
      bio: "Zaid Al-Badareen is the Founder and CEO of ZentexAI, an AI solutions and project management consulting company focused on helping organizations adopt practical artificial intelligence and deliver successful projects. He holds a Bachelor's degree in Electrical Engineering, is a PMP® certified project management professional, and earned a Master of Science (MSc) in Artificial Intelligence. Through ZentexAI, he combines engineering, project management, and AI expertise to help organizations implement practical AI solutions while supporting professionals in developing the project management skills needed to succeed in today's rapidly evolving workplace.",
    },
    cta_h2: "Want to work with us?",
    cta_p: "Tell us about your organization or your goals — we'll get back to you personally.",
    cta_btn: "Get in Touch",
  },

  // ── Resources ────────────────────────────────────────────────────────────────
  resources: {
    hero_eyebrow: "Resources",
    hero_h1: "Resources",
    hero_sub: "Articles, insights, and free resources on AI adoption and project management — from the ZentexAI team.",
    blog_title: "Blog",
    blog_desc: "Practical articles on AI, project management, and professional growth.",
    insights_title: "Insights",
    insights_desc: "Our take on where AI and project management are heading.",
    free_title: "Free Resources",
    free_desc: "Guides and templates — coming soon.",
    articles_h2: "Latest Articles",
    articles_empty: "No articles published yet. Check back soon.",
    view_all: "View all articles",
  },

  // ── Blog ─────────────────────────────────────────────────────────────────────
  blog: {
    hero_eyebrow: "Resources",
    hero_h1: "Blog",
    hero_sub: "Articles and insights from the ZentexAI team.",
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
    inquiry_types: [
      { value: "business", label: "Business Inquiry" },
      { value: "consultation", label: "Consultation Request" },
      { value: "training", label: "Training Inquiry" },
      { value: "general", label: "General Contact" },
    ],
    details: [
      { id: "whatsapp", label: "WhatsApp", value: "+971 56 622 7824", href: "https://wa.me/971566227824", icon: "◎" },
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
    workspace: {
      curriculum_heading: "Course Content",
      progress_label: "{completed}/{total} lessons completed",
      view_curriculum: "Course Content",
      close_curriculum: "Close",
      duration_minutes_label: "{n} min",
    },
  },

  // ── Academy Commerce (Sprint 10) ────────────────────────────────────────────
  commerce: {
    storefront: {
      eyebrow: "Academy",
      heading: "Courses & Programs",
      sub: "Browse the PMP Mastery Program, PMP Exam Simulator, and Complete Package — no account required to look around.",
      empty: "No programs are available yet. Check back soon.",
    },
    card: {
      view_details: "View Details",
      enroll_free: "Enroll for Free",
      enrolling: "Enrolling...",
      continue_learning: "Continue Learning",
      owned_badge: "Owned",
      opening_soon: "Online enrollment opening soon",
      access_duration: "{n} months access",
      free_badge: "FREE",
      launch_offer_badge: "Launch Offer",
      buy_now: "Buy Now",
      redirecting_to_payment: "Redirecting to payment...",
    },
    product: {
      overview_heading: "Overview",
      curriculum_heading: "Curriculum",
      curriculum_empty: "The curriculum is being finalized and will be published here soon.",
      included_heading: "What's Included",
      pricing_heading: "Pricing",
      regular_price_label: "Regular price",
      promo_ends_label: "Offer ends",
      capability_course: "PMP Mastery Program course access",
      capability_practice: "PMP Practice Mode",
      capability_mock_exam: "PMP Mock Exam",
      not_found: "This program isn't available.",
      login_prompt: "Log in or create an account to continue.",
      login_cta: "Log In",
      signup_cta: "Sign Up",
    },
    locked: {
      course_title: "Course Access Required",
      course_body: "This lesson is part of the PMP Mastery Program. Enroll to unlock the full course.",
      course_cta: "View PMP Mastery Program",
      simulator_title: "Simulator Access Required",
      simulator_body: "PMP Practice and Mock Exam are part of the PMP Exam Simulator. Enroll to unlock full access.",
      simulator_cta: "View PMP Exam Simulator",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      already_owned: "You already have access to this.",
      checkout_unavailable: "Checkout is temporarily unavailable. Please try again shortly.",
      rate_limited: "Too many attempts. Please wait a moment and try again.",
      not_payable: "This product isn't available for purchase right now.",
      product_unavailable: "This product is not currently available.",
    },
    dashboard: {
      owned_heading: "My Learning",
      empty: "You don't own any programs yet.",
      browse_courses: "Browse Courses",
      expires_label: "Access until",
      open_course: "Continue Course",
      open_practice: "Start Practicing",
      open_mock_exam: "Start Mock Exam",
    },
    checkout: {
      success_heading: "Payment Successful",
      success_body: "You now have full access to the PMP Exam Simulator — Practice Mode and Mock Exam.",
      access_until_label: "Access until",
      pending_heading: "Confirming Your Payment",
      pending_body: "We're still confirming your payment with Ziina. This usually takes a few seconds.",
      refresh: "Refresh",
      failed_heading: "Payment Failed",
      failed_body: "Your payment didn't go through and you have not been charged. You can try again.",
      cancelled_heading: "Checkout Cancelled",
      cancelled_body: "You cancelled checkout and have not been charged.",
      not_found_heading: "We Couldn't Find That Order",
      not_found_body: "This checkout link is invalid or has expired.",
      go_to_practice: "Go to Practice Mode",
      go_to_mock_exam: "Go to Mock Exam",
      back_to_product: "Back to PMP Exam Simulator",
      try_again: "Try Again",
    },
  },
};

// ─── Arabic ───────────────────────────────────────────────────────────────────

const ar: Translations = {
  nav: {
    home: "الرئيسية", services: "الخدمات", academy: "الأكاديمية", resources: "الموارد",
    about: "من نحن", contact: "تواصل معنا", login: "تسجيل الدخول",
    dashboard: "لوحة التحكم", logout: "تسجيل الخروج",
  },
  academyNav: {
    brand: "أكاديمية زينتكس AI", courses: "الدورات", practice: "التدريب", mockExam: "الامتحان التجريبي", enroll: "سجّل الآن",
  },
  assessment: {
    langToggle: "تغيير اللغة",
    runner: {
      section: "القسم", question: "السؤال", of: "من",
      flagged: "مُعلَّم للمراجعة", flagForReview: "علّم للمراجعة",
      previous: "السابق", next: "التالي", finishSection: "إنهاء القسم",
      submitExam: "تسليم الامتحان", submitPractice: "تسليم التدريب", submitting: "جارٍ التسليم...",
      submitConfirmTitle: "هل تريد التسليم مع وجود أسئلة غير مجابة؟", submitConfirmBody: "لديك {count} سؤال غير مجاب. تُحتسب الأسئلة غير المجابة كإجابات خاطئة.",
      keepGoing: "متابعة", submitAnyway: "تسليم على أي حال",
      saveWarning: "قد لا تكون إجابتك الأخيرة قد حُفظت - تحقق من اتصالك.", noQuestionAvailable: "هذا السؤال لم يعد متاحًا. استخدم لوحة التنقل للمتابعة بسؤال آخر.",
    },
    navigator: {
      questions: "الأسئلة", sectionQuestions: "أسئلة القسم {n}", answered: "مجاب عنها", unanswered: "غير مجابة", flagged: "مُعلَّمة",
      sealedNote: "الأقسام المكتملة مغلقة ولا يمكن مراجعتها مرة أخرى.",
    },
    breakScreen: {
      scheduledBreak: "استراحة مجدولة {n}", clockPaused: "ساعة الامتحان متوقفة مؤقتًا. الوقت غير المستخدم من هذه الاستراحة يُعاد إلى امتحانك. يستأنف الامتحان تلقائيًا عند انتهاء الاستراحة.",
      resumeNow: "استئناف الامتحان الآن", resuming: "جارٍ الاستئناف...",
    },
    sectionComplete: {
      sectionComplete: "اكتمل القسم {n}", takeBreakOrContinue: "خذ استراحة أو تابع", continueToSection: "المتابعة إلى القسم {n}",
      breakBody: "لقد وصلت إلى نقطة استراحة مجدولة. بمجرد اختيارك، يُغلق القسم {n} ولا يمكن مراجعته مرة أخرى.",
      continueBody: "القسم {n} مغلق الآن ولا يمكن مراجعته مرة أخرى. يبدأ القسم {next} بعد ذلك.",
      startBreak: "بدء استراحة {n} دقائق", continueWithoutBreak: "المتابعة بدون استراحة إلى القسم {n}", pleaseWait: "يرجى الانتظار...",
    },
    results: {
      score: "النتيجة", correct: "صحيحة", incorrect: "خاطئة", unanswered: "غير مجابة", timeExpired: "انتهى الوقت",
      timeSpent: "الوقت المستغرق", avgPerQuestion: "متوسط الوقت لكل سؤال", flaggedCount: "المُعلَّمة",
      byDomain: "حسب المجال", byApproach: "حسب المنهجية", byDifficulty: "حسب الصعوبة", byQuestionType: "حسب نوع السؤال", byTopic: "حسب الموضوع",
      noPmiPassingScore: "لا ينشر معهد إدارة المشاريع (PMI) درجة نجاح رقمية لامتحان PMP الحقيقي - هذه النسبة مخصصة للتقييم الذاتي فقط.",
      newMockExam: "امتحان تجريبي جديد", newPractice: "جلسة تدريب جديدة", retakeSameExam: "إعادة نفس الامتحان", startNewExam: "بدء امتحان جديد", viewHistory: "عرض السجل", backToResults: "العودة إلى النتائج",
    },
    review: {
      all: "الكل", incorrect: "خاطئة", correct: "صحيحة", unanswered: "غير مجابة", flagged: "مُعلَّمة",
      noQuestionsMatch: "لا توجد أسئلة مطابقة لهذا الفلتر.", selectQuestion: "اختر سؤالاً لمراجعته بالتفصيل.",
      yourAnswer: "إجابتك", correctAnswer: "الإجابة الصحيحة", explanation: "الشرح", keyConcept: "المفهوم الأساسي", examTip: "نصيحة للامتحان", commonTrap: "خطأ شائع",
      whyWrong: "لماذا هذه إجابة خاطئة", previousQuestion: "← السابق", nextQuestion: "التالي →", backToGrid: "← العودة إلى القائمة", loading: "جارٍ التحميل...",
    },
    history: {
      title: "السجل", attempt: "محاولة", retake: "إعادة", noAttemptsYet: "لا توجد محاولات بعد", startPrompt: "ابدأ محاولة لترى سجلك ونتائجك هنا.",
      resume: "استئناف", results: "النتائج", comparePerformance: "مقارنة الأداء", previousScore: "النتيجة السابقة", currentScore: "النتيجة الحالية",
    },
  },
  footer: {
    tagline: "حلول ذكاء اصطناعي، استشارات إدارة مشاريع، وتعليم احترافي — لمنطقة الشرق الأوسط وشمال أفريقيا.",
    rights: "جميع الحقوق محفوظة.",
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
    badge: "حلول الذكاء الاصطناعي · الاستشارات · التعليم الاحترافي",
    headline1: "ذكاء اصطناعي عملي.",
    headline2: "نتائج مشاريع حقيقية.",
    sub: "تساعد ZentexAI المؤسسات على تبني الذكاء الاصطناعي بفعالية وتعزيز طريقة تسليم مشاريعها — من خلال حلول الذكاء الاصطناعي، والاستشارات العملية، وبرامج التعليم الاحترافي، بما في ذلك برنامجنا الرائد PMP Mastery Program.",
    cta_primary: "تحدث إلى فريقنا",
    cta_secondary: "استكشف الخدمات",
    region_note: "نخدم المؤسسات والمهنيين في المملكة العربية السعودية ومنطقة الشرق الأوسط وشمال أفريقيا",
  },
  cta: {
    badge: "تواصل معنا",
    headline: "لنعمل معاً",
    sub: "أخبرنا عن مؤسستك وما تسعى لتحقيقه. سنعود إليك بمقترح واضح — دون أي إلزام.",
  },
  form: {
    name: "الاسم الكامل", name_placeholder: "اسمك",
    email: "البريد الإلكتروني", email_placeholder: "you@company.com",
    company: "الشركة", company_placeholder: "اسم شركتك", company_optional: "(اختياري)",
    inquiry_type: "كيف يمكننا مساعدتك؟",
    message: "الرسالة", message_placeholder: "صف مشروعك أو ما تحتاج المساعدة فيه...",
    submit: "إرسال الرسالة", submitting: "جارٍ الإرسال…",
    success_title: "تم استلام رسالتك",
    success_sub: "شكراً على تواصلك. سيتواصل معك أحد أعضاء فريقنا خلال 24 ساعة.",
    send_another: "إرسال رسالة أخرى",
  },

  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    core_services_eyebrow: "ما نقدمه",
    core_services_h2: "خدماتنا الأساسية",
    core_services_sub: "ثلاثة تخصصات، فريق واحد: ذكاء اصطناعي عملي، تسليم مشاريع سليم، وتعليم احترافي يدعم كليهما.",
    core_services_link: "← استكشف جميع الخدمات",

    why_eyebrow: "لماذا ZentexAI",
    why_h2: "ما الذي يميّزنا",
    why_sub: "نجمع بين هندسة الذكاء الاصطناعي وخبرة إدارة المشاريع ونزعة حقيقية نحو التسليم الفعلي — لا مجرد التوصيات.",
    benefits: [
      { title: "تسليم فعلي، لا تقارير فقط",
        desc: "نبني وننفذ — لا نكتفي بالنصح. كل مشاركة تنتهي بشيء جاهز للعمل بين يديك." },
      { title: "خبرة في إدارة المشاريع",
        desc: "نهجنا في تبني الذكاء الاصطناعي مبني على انضباط حقيقي في إدارة المشاريع، لا مجرد حماس تقني." },
      { title: "ثنائي اللغة بالتصميم",
        desc: "نعمل بالعربية والإنجليزية. حلولنا مصممة لسوق الشرق الأوسط، لا مترجمة إليه." },
      { title: "نطاق واضح، تسعير واضح",
        desc: "لا عقود مبهمة. كل مشاركة تبدأ بنطاق محدد وجدول زمني وتسليمات واضحة." },
      { title: "تبنٍّ مسؤول للذكاء الاصطناعي",
        desc: "نساعدك على تبني الذكاء الاصطناعي بطريقة قابلة للحوكمة والاستدامة — لا مجرد السرعة." },
      { title: "شريك واحد، تخصصات متعددة",
        desc: "حلول الذكاء الاصطناعي والاستشارات والتعليم الاحترافي تحت سقف واحد — حتى يتطور فريقك مع ما نبنيه." },
    ],

    featured_eyebrow: "برنامجنا المميز",
    featured_h2_line1: "PMP Mastery Program",
    featured_h2_line2: "منتجنا الرائد",
    featured_p1: "تجربة متكاملة للتحضير لامتحان PMP — دروس منظمة، بنك أسئلة تدريبية كامل، محاكاة امتحانات مؤقتة، وتتبع للتقدم، بناها فريق حاصل على شهادة PMP.",
    featured_p2: "هذا أول برامج التعليم الاحترافي المتعددة التي نبنيها في ZentexAI.",
    featured_features: [
      "دروس منظمة متوافقة مع مخطط محتوى امتحان PMP",
      "بنك أسئلة تدريبية كامل عبر محاكي PMP",
      "جلسات تدريب مؤقتة بأسلوب الامتحان الفعلي",
      "تتبع للتقدم من درسك الأول حتى نتيجتك التدريبية الأخيرة",
    ],
    featured_btn1: "سجّل الآن",
    featured_btn2: "عرض البرنامج",

    founder_eyebrow: "القيادة",
    founder_h2: "تعرّف على المؤسس",
    founder_summary: "تأسست ZentexAI على يد زيد البدارين، المؤسس والرئيس التنفيذي — مهندس كهربائي، حاصل على شهادة PMP® في إدارة المشاريع، وحاصل على درجة الماجستير في العلوم (MSc) في الذكاء الاصطناعي.",
    founder_btn: "← اقرأ القصة كاملة",

    articles_eyebrow: "الموارد",
    articles_h2: "أحدث المقالات",
    articles_sub: "رؤى عملية حول تبني الذكاء الاصطناعي وإدارة المشاريع.",
    articles_empty: "نحن بصدد إعداد أولى مقالاتنا. تفقّد الموقع لاحقاً.",
    articles_view_all: "← عرض جميع المقالات",
  },

  // ── Services ─────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "ما نقدمه",
    hero_h1: "الخدمات",
    hero_sub: "حلول ذكاء اصطناعي، استشارات ذكاء اصطناعي، واستشارات إدارة مشاريع — مبنية لتحقيق نتائج فعلية، لا مجرد توصيات.",
    categories: [
      {
        id: "ai-solutions",
        title: "حلول الذكاء الاصطناعي",
        desc: "أنظمة ذكاء اصطناعي عملية مبنية لتؤدي عملاً حقيقياً داخل مؤسستك.",
        examples: ["وكلاء ذكاء اصطناعي", "أتمتة سير العمل", "روبوتات محادثة للأعمال", "مساعدات معرفية", "تطبيقات ذكاء اصطناعي مخصصة"],
      },
      {
        id: "ai-consulting",
        title: "استشارات الذكاء الاصطناعي",
        desc: "إرشاد واضح حول أين يناسب الذكاء الاصطناعي مؤسستك، وكيفية تبنيه بمسؤولية.",
        examples: ["تقييم الجاهزية للذكاء الاصطناعي", "استراتيجية الذكاء الاصطناعي", "تبني الذكاء الاصطناعي", "الذكاء الاصطناعي المسؤول", "حوكمة الذكاء الاصطناعي"],
      },
      {
        id: "pm-consulting",
        title: "استشارات إدارة المشاريع",
        desc: "خبرة عملية في تسليم المشاريع — من إنشاء مكتب إدارة المشاريع إلى إنقاذ مشروع متعثر.",
        examples: ["إنشاء مكتب إدارة المشاريع", "التحول إلى الأجايل", "التسليم الهجين", "إنقاذ المشاريع", "إدارة المخاطر"],
      },
    ],
    process_eyebrow: "طريقة عملنا",
    process_h2: "منهجيتنا",
    process: [
      { step: "01", title: "الاكتشاف", desc: "نبدأ بفهم مؤسستك وأهدافها والقيود التي تواجهها." },
      { step: "02", title: "الاستراتيجية", desc: "نصمم نهجاً ونطاقاً يناسبان وضعك الفعلي." },
      { step: "03", title: "البناء", desc: "يقوم فريقنا بتنفيذ الحل أو المشاركة واختباره وتحسينه." },
      { step: "04", title: "التسليم", desc: "نسلّم ما تم الاتفاق عليه، وندعم فريقك، ونبقى متاحين بعد الإطلاق." },
    ],
    cta_h2: "هل لديك مشروع في ذهنك؟",
    cta_p: "أخبرنا عنه. سنرد خلال 24 ساعة.",
    cta_btn1: "تواصل معنا",
    cta_btn2: "من نحن",
  },

  // ── Academy ──────────────────────────────────────────────────────────────────
  academy: {
    hero_eyebrow: "التعليم الاحترافي",
    hero_h1: "أكاديمية ZentexAI",
    hero_sub: "برنامجنا الرائد PMP Mastery Program، ومحاكي PMP، وبرامج احترافية مستقبلية — كل ذلك في مكان واحد.",
    hero_btn1: "سجّل الآن",
    hero_btn2: "عرض البرنامج",
    features: [
      { title: "منهج مبني بعناية", desc: "دروس وأسئلة تدريبية مبنية حول مخطط محتوى امتحان PMP الحالي." },
      { title: "تعلّم مرن", desc: "وحدات بالوتيرة الذاتية مصممة للمهنيين المشغولين. تعلّم وفق جدولك." },
      { title: "محرك تدريب متكامل", desc: "بنك أسئلة كبير، جلسات تدريب قابلة للتصفية، ومحاكاة امتحانات مؤقتة." },
      { title: "محتوى إقليمي", desc: "محتوى ثنائي اللغة مصمم للبيئة التجارية في الخليج ومنطقة الشرق الأوسط وشمال أفريقيا." },
    ],
    programs_eyebrow: "البرامج",
    programs_h2: "المتاح حالياً",
    programs: [
      {
        id: "pmp-mastery", title: "PMP Mastery Program", tag: "إدارة المشاريع", status: "متاح الآن", duration: "8 أسابيع",
        desc: "تحضير شامل لامتحان PMP — وحدات منظمة، بنك أسئلة تدريبية كامل، محاكاة امتحانات مؤقتة، وإرشاد متخصص.",
      },
      {
        id: "pmp-simulator", title: "محاكي PMP", tag: "تدريب الامتحان", status: "متاح الآن",
        desc: "تدرّب بأسئلة حقيقية بأسلوب الامتحان من بنك أسئلة PMP الكامل — صفِّ حسب المجال أو النهج أو الصعوبة، بوقت محدد أو دون وقت، مع تصحيح فوري ومراجعة.",
      },
      {
        id: "future-programs", title: "برامج احترافية مستقبلية", tag: "قريباً", status: "قيد التطوير",
        desc: "نعمل على تطوير برامج شهادات ومهارات احترافية إضافية. تواصل معنا إن أردت أن نخبرك عند إطلاق برامج جديدة.",
      },
    ],
    bottom_h2: "هل أنت مستعد للبدء بالتحضير لامتحان PMP؟",
    bottom_p: "يمكن لفريقنا شرح البرنامج والإجابة عن أي استفسار قبل التسجيل.",
    bottom_btn: "تحدث إلينا",
  },

  // ── About ─────────────────────────────────────────────────────────────────────
  about: {
    hero_eyebrow: "قصتنا",
    hero_h1: "عن ZentexAI",
    hero_sub: "شركة حلول ذكاء اصطناعي، واستشارات إدارة مشاريع، وتعليم احترافي — مبنية لتسلّم، لا لتنصح فقط.",
    mission_eyebrow: "رسالتنا",
    mission_h2_line1: "خبرة",
    mission_h2_line2: "تحقق نتائج فعلية",
    mission_p1: "تأسست ZentexAI لمساعدة المؤسسات على تبني الذكاء الاصطناعي بفعالية وتعزيز طريقة تسليم مشاريعها — بالجمع بين حلول الذكاء الاصطناعي والاستشارات والتعليم الاحترافي تحت سقف واحد.",
    mission_p2: "نؤمن بأن التبني الجيد للذكاء الاصطناعي وإدارة المشاريع الجيدة يشتركان في الأساس نفسه: تفكير واضح، نطاق واقعي، ومتابعة حتى النهاية. هذا ما نبنيه لعملائنا ونعلّمه عبر برامجنا.",
    vision_eyebrow: "رؤيتنا",
    vision_h2: "إلى أين نتجه",
    vision_p: "نبني ZentexAI لتكون الشركة التي تلجأ إليها المؤسسات لحلول الذكاء الاصطناعي واستشارات إدارة المشاريع والتعليم الاحترافي — بدءاً ببرنامج PMP Mastery Program وتوسعاً مع نمونا.",
    values_eyebrow: "قيمنا",
    values_h2: "ما نؤمن به",
    values: [
      { title: "التميّز",
        desc: "نلتزم بمعيار عالٍ في عملنا، سواء كان وكيل ذكاء اصطناعي واحد أو خطة إنقاذ مشروع كاملة." },
      { title: "العملية",
        desc: "نفضّل الحلول التي تعمل فعلياً على الأفكار التي تعمل نظرياً فقط." },
      { title: "النزاهة",
        desc: "نكون صريحين حول ما يمكن للذكاء الاصطناعي وإدارة المشاريع الجيدة تقديمه لك — وما لا يمكنهما تقديمه." },
    ],
    founder_eyebrow: "القيادة",
    founder_h2: "تعرّف على المؤسس",
    founder: {
      name: "زيد البدارين",
      titles: ["المؤسس والرئيس التنفيذي، ZentexAI", "مهندس كهربائي", "PMP® - محترف معتمد في إدارة المشاريع", "ماجستير العلوم (MSc) في الذكاء الاصطناعي"],
      bio: "زيد البدارين هو المؤسس والرئيس التنفيذي لشركة ZentexAI، شركة حلول ذكاء اصطناعي واستشارات إدارة مشاريع تركز على مساعدة المؤسسات على تبني الذكاء الاصطناعي العملي وتسليم مشاريع ناجحة. يحمل درجة البكالوريوس في الهندسة الكهربائية، وهو محترف معتمد PMP® في إدارة المشاريع، وحصل على درجة الماجستير في العلوم (MSc) في الذكاء الاصطناعي. من خلال ZentexAI، يجمع بين خبرته الهندسية وخبرته في إدارة المشاريع وتخصصه في الذكاء الاصطناعي لمساعدة المؤسسات على تطبيق حلول ذكاء اصطناعي عملية، ودعم المهنيين في تطوير مهارات إدارة المشاريع اللازمة للنجاح في بيئة العمل سريعة التطور اليوم.",
    },
    cta_h2: "هل تريد العمل معنا؟",
    cta_p: "أخبرنا عن مؤسستك أو أهدافك — سنعاود التواصل معك شخصياً.",
    cta_btn: "تواصل معنا",
  },

  // ── Resources ────────────────────────────────────────────────────────────────
  resources: {
    hero_eyebrow: "الموارد",
    hero_h1: "الموارد",
    hero_sub: "مقالات ورؤى وموارد مجانية حول تبني الذكاء الاصطناعي وإدارة المشاريع — من فريق ZentexAI.",
    blog_title: "المدونة",
    blog_desc: "مقالات عملية حول الذكاء الاصطناعي وإدارة المشاريع والتطور المهني.",
    insights_title: "رؤى وتحليلات",
    insights_desc: "وجهة نظرنا حول مستقبل الذكاء الاصطناعي وإدارة المشاريع.",
    free_title: "موارد مجانية",
    free_desc: "أدلة وقوالب — قريباً.",
    articles_h2: "أحدث المقالات",
    articles_empty: "لا توجد مقالات منشورة بعد. تفقّد الموقع لاحقاً.",
    view_all: "عرض جميع المقالات",
  },

  // ── Blog ──────────────────────────────────────────────────────────────────────
  blog: {
    hero_eyebrow: "الموارد",
    hero_h1: "المدونة",
    hero_sub: "مقالات ورؤى من فريق ZentexAI.",
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
    inquiry_types: [
      { value: "business", label: "استفسار أعمال" },
      { value: "consultation", label: "طلب استشارة" },
      { value: "training", label: "استفسار تدريب" },
      { value: "general", label: "تواصل عام" },
    ],
    details: [
      { id: "whatsapp", label: "واتساب", value: "+971 56 622 7824", href: "https://wa.me/971566227824", icon: "◎" },
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
    workspace: {
      curriculum_heading: "محتوى الدورة",
      progress_label: "{completed}/{total} دروس مكتملة",
      view_curriculum: "محتوى الدورة",
      close_curriculum: "إغلاق",
      duration_minutes_label: "{n} دقيقة",
    },
  },

  // ── تجارة الأكاديمية (Sprint 10) ────────────────────────────────────────────
  commerce: {
    storefront: {
      eyebrow: "الأكاديمية",
      heading: "الدورات والبرامج",
      sub: "تصفح برنامج احتراف PMP، ومحاكي اختبار PMP، والباقة الكاملة — دون الحاجة لإنشاء حساب للتصفح.",
      empty: "لا توجد برامج متاحة حالياً. تحقق مرة أخرى قريباً.",
    },
    card: {
      view_details: "عرض التفاصيل",
      enroll_free: "التسجيل مجاناً",
      enrolling: "جارٍ التسجيل...",
      continue_learning: "متابعة التعلم",
      owned_badge: "مملوك",
      opening_soon: "سيتاح التسجيل الإلكتروني قريبًا",
      access_duration: "وصول لمدة {n} شهراً",
      free_badge: "مجاناً",
      launch_offer_badge: "عرض الإطلاق",
      buy_now: "اشترِ الآن",
      redirecting_to_payment: "جارٍ التحويل إلى صفحة الدفع...",
    },
    product: {
      overview_heading: "نظرة عامة",
      curriculum_heading: "المنهج",
      curriculum_empty: "يجري حالياً إعداد المنهج الدراسي وسيتم نشره هنا قريباً.",
      included_heading: "ما الذي يشمله",
      pricing_heading: "السعر",
      regular_price_label: "السعر العادي",
      promo_ends_label: "ينتهي العرض في",
      capability_course: "الوصول إلى دورة برنامج احتراف PMP",
      capability_practice: "وضع تدريب PMP",
      capability_mock_exam: "اختبار PMP التجريبي",
      not_found: "هذا البرنامج غير متاح.",
      login_prompt: "سجّل الدخول أو أنشئ حساباً للمتابعة.",
      login_cta: "تسجيل الدخول",
      signup_cta: "إنشاء حساب",
    },
    locked: {
      course_title: "الوصول إلى الدورة مطلوب",
      course_body: "هذا الدرس جزء من برنامج احتراف PMP. سجّل للحصول على وصول كامل للدورة.",
      course_cta: "عرض برنامج احتراف PMP",
      simulator_title: "الوصول إلى المحاكي مطلوب",
      simulator_body: "وضع التدريب والاختبار التجريبي لـ PMP جزء من محاكي اختبار PMP. سجّل للحصول على وصول كامل.",
      simulator_cta: "عرض محاكي اختبار PMP",
    },
    errors: {
      generic: "حدث خطأ ما. حاول مرة أخرى.",
      already_owned: "لديك بالفعل وصول إلى هذا المنتج.",
      checkout_unavailable: "الدفع غير متاح حالياً. حاول مرة أخرى بعد قليل.",
      rate_limited: "محاولات كثيرة جداً. الرجاء الانتظار قليلاً ثم المحاولة مرة أخرى.",
      not_payable: "هذا المنتج غير متاح للشراء حالياً.",
      product_unavailable: "هذا المنتج غير متاح حالياً.",
    },
    dashboard: {
      owned_heading: "تعلّمي",
      empty: "لا تملك أي برامج بعد.",
      browse_courses: "تصفح الدورات",
      expires_label: "الوصول حتى",
      open_course: "متابعة الدورة",
      open_practice: "ابدأ التدريب",
      open_mock_exam: "ابدأ الاختبار التجريبي",
    },
    checkout: {
      success_heading: "تم الدفع بنجاح",
      success_body: "أصبح لديك الآن وصول كامل إلى محاكي اختبار PMP — وضع التدريب والاختبار التجريبي.",
      access_until_label: "الوصول حتى",
      pending_heading: "جارٍ تأكيد الدفع",
      pending_body: "ما زلنا نؤكد عملية الدفع مع Ziina. عادةً ما يستغرق هذا بضع ثوانٍ.",
      refresh: "تحديث",
      failed_heading: "فشلت عملية الدفع",
      failed_body: "لم تكتمل عملية الدفع ولم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى.",
      cancelled_heading: "تم إلغاء الدفع",
      cancelled_body: "لقد ألغيت عملية الدفع ولم يتم خصم أي مبلغ.",
      not_found_heading: "لم نتمكن من العثور على هذا الطلب",
      not_found_body: "رابط الدفع هذا غير صالح أو منتهي الصلاحية.",
      go_to_practice: "الذهاب إلى وضع التدريب",
      go_to_mock_exam: "الذهاب إلى الاختبار التجريبي",
      back_to_product: "العودة إلى محاكي اختبار PMP",
      try_again: "حاول مرة أخرى",
    },
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

const translations: Record<Lang, Translations> = { en, ar };
export default translations;

/** Interpolates {placeholder} tokens in a translation string, e.g. tf(t.assessment.sectionComplete.sectionComplete, { n: 1 }) -> "Section 1 Complete". */
export function tf(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
