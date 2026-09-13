export type Lang = "en" | "ar";

// ─── Shared types ─────────────────────────────────────────────────────────────



interface ProcessStep { step: string; title: string; desc: string }
interface ValueItem { title: string; desc: string }
interface FeatureItem { title: string; desc: string }
interface BenefitItem { title: string; desc: string }
interface ContactDetail { id: string; label: string; value: string; href: string | null; icon: string }
interface ServiceCategory { id: string; title: string; desc: string; examples: string[]; learnMoreHref?: string; learnMoreLabel?: string; learnMoreHref2?: string; learnMoreLabel2?: string }
interface AcademyProgram { id: string; title: string; tag: string; status: string; duration?: string; desc: string }
interface FounderInfo { name: string; titles: string[]; bio: string }
interface InquiryType { value: string; label: string }
interface FaqItem { q: string; a: string }

// ─── Translation shape ────────────────────────────────────────────────────────

export interface Translations {
  nav: {
    home: string; services: string; academy: string; resources: string; blog: string;
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
  aiAgentsAutomation: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string; hero_cta1: string; hero_cta2: string;
    compare_h2: string;
    compare_chatbot_label: string; compare_chatbot_desc: string;
    compare_agent_label: string; compare_agent_desc: string;
    automate_eyebrow: string; automate_h2: string; automate_sub: string;
    automate_cards: FeatureItem[];
    how_eyebrow: string; how_h2: string; how_sub: string;
    how_steps: ProcessStep[];
    security_eyebrow: string; security_h2: string; security_sub: string;
    security_points: FeatureItem[];
    usecases_eyebrow: string; usecases_h2: string; usecases_sub: string;
    usecases: FeatureItem[];
    process_eyebrow: string; process_h2: string;
    process: ProcessStep[];
    faq_eyebrow: string; faq_h2: string;
    faq: FaqItem[];
    cta_h2: string; cta_sub: string; cta_btn: string;
  };
  whatsappAutomation: {
    hero_eyebrow: string; hero_h1: string; hero_sub: string; hero_cta1: string; hero_cta2: string;
    compare_h2: string;
    compare_chatbot_label: string; compare_chatbot_desc: string;
    compare_agent_label: string; compare_agent_desc: string;
    automate_eyebrow: string; automate_h2: string; automate_sub: string;
    automate_cards: FeatureItem[];
    workflow_eyebrow: string; workflow_h2: string; workflow_sub: string;
    workflow_steps: string[];
    crm_eyebrow: string; crm_h2: string; crm_p1: string; crm_p2: string; crm_p3: string; crm_note: string;
    booking_eyebrow: string; booking_h2: string; booking_sub: string;
    booking_steps: string[];
    lang_h2: string; lang_p: string;
    platform_h2: string; platform_p: string;
    security_eyebrow: string; security_h2: string; security_sub: string;
    security_points: FeatureItem[];
    usecases_eyebrow: string; usecases_h2: string; usecases_sub: string;
    usecases: FeatureItem[];
    process_eyebrow: string; process_h2: string; process_sub: string;
    process: ProcessStep[];
    faq_eyebrow: string; faq_h2: string;
    faq: FaqItem[];
    cta_h2: string; cta_sub: string; cta_btn: string;
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
      title: string; sub: string; sub_after_email: string; sub_generic: string;
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
      retry: string; continue_learning: string; view_history: string; not_ready: string; locked: string;
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
      take_quiz: string; retake_quiz: string; quiz_passed: string;
      quiz_locked: string; quiz_locked_hint: string;
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
      learn_heading: string; learn_points: string[]; included_structure_label: string;
      instructor: { heading: string; name: string; credentials: string; role: string; bio: string };
    };
    locked: {
      course_title: string; course_body: string; course_cta: string;
      simulator_title: string; simulator_body: string; simulator_cta: string;
    };
    errors: { generic: string; already_owned: string; checkout_unavailable: string; not_payable: string; product_unavailable: string; rate_limited: string };
    dashboard: {
      owned_heading: string; empty: string; browse_courses: string; expires_label: string;
      open_course: string; open_practice: string; open_mock_exam: string;
      certificate_locked: string; certificate_view: string; certificate_download: string;
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
  certificate: {
    heading: string;
    not_entitled_body: string; not_entitled_cta: string;
    not_eligible_heading: string; not_eligible_body: string;
    missing_name_heading: string; missing_name_body: string;
    first_name_label: string; last_name_label: string; name_save: string; name_saving: string; name_error: string;
    academy_name: string; program_name: string;
    certifies_that: string; has_completed: string; offered_by: string;
    issued_on_label: string; certificate_number_label: string; instructor_label: string;
    instructor_name: string; instructor_role: string;
    download_pdf: string; preparing_pdf: string; view_verification: string;
    disclaimer: string;
    back_to_dashboard: string;
  };
  verify: {
    heading: string; sub: string;
    valid_heading: string; not_found_heading: string; not_found_body: string;
    student_label: string; course_label: string; issued_label: string; certificate_number_label: string;
    academy_name: string;
  };
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    home: "Home", services: "Services", academy: "Academy", resources: "Resources", blog: "Blog",
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
    region_note: "Serving organizations and professionals across the UAE and the wider MENA region",
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
    articles_h2: "Latest Insights",
    articles_sub: "Practical insights on artificial intelligence and project management.",
    articles_empty: "We're preparing our first articles. Check back soon.",
    articles_view_all: "View All Articles",
  },

  // ── Services ────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "What We Offer",
    hero_h1: "Services",
    hero_sub: "AI solutions, AI consulting, and project management consulting for businesses in the UAE and across the region — built to produce real outcomes, not just recommendations.",
    categories: [
      {
        id: "ai-solutions",
        title: "AI Solutions",
        desc: "Practical AI systems built to do real work inside your organization.",
        examples: ["AI Agents", "Workflow Automation", "Business Chatbots", "Knowledge Assistants", "Custom AI Applications"],
        learnMoreHref: "/services/ai-agents-automation-uae",
        learnMoreLabel: "Learn more about AI agents & automation →",
        learnMoreHref2: "/services/whatsapp-automation-uae",
        learnMoreLabel2: "See WhatsApp automation & AI agents →",
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

  aiAgentsAutomation: {
    hero_eyebrow: "AI Agents & Automation",
    hero_h1: "AI Agents & Business Automation for UAE Businesses",
    hero_sub: "Secure, production-ready AI agents that connect knowledge, workflows, and business systems to perform approved work — with human oversight where it matters.",
    hero_cta1: "Discuss Your AI Workflow",
    hero_cta2: "Explore Use Cases",

    compare_h2: "Not Just a Chatbot",
    compare_chatbot_label: "A Simple Chatbot",
    compare_chatbot_desc: "Responds to messages using scripted or generic replies, with little awareness of your business context, data, or systems.",
    compare_agent_label: "A Production AI Agent",
    compare_agent_desc: "Understands context using your approved knowledge, decides within clear boundaries, calls the systems it's permitted to use, performs the action, verifies the outcome, and escalates to a person when the situation calls for it.",

    automate_eyebrow: "Capabilities",
    automate_h2: "What ZentexAI Can Automate",
    automate_sub: "Real workflow categories we build AI agents around — not a generic feature list.",
    automate_cards: [
      { title: "Customer Support & FAQs", desc: "Grounded answers to common customer questions, with escalation when a question needs a person." },
      { title: "Lead Capture & Qualification", desc: "New enquiries are captured, qualified against your criteria, and logged for follow-up." },
      { title: "Appointment Scheduling", desc: "Enquiries are turned into booked appointments, with confirmations and reminders handled automatically." },
      { title: "Document & Request Processing", desc: "Incoming requests or documents are read, classified, and routed to the right process." },
      { title: "Internal Knowledge Assistance", desc: "Employees get answers from your approved internal knowledge instead of searching scattered documents." },
      { title: "Reporting & Status Updates", desc: "Approved data is collected, summarized, and routed to the right person on schedule." },
    ],

    how_eyebrow: "How It Works",
    how_h2: "Understand. Decide. Act. Verify. Escalate.",
    how_sub: "The same five-step pattern underlies every agent we build, adapted to your approved workflow and permissions.",
    how_steps: [
      { step: "01", title: "Understand", desc: "The agent reads the incoming request or message and interprets it using your approved business knowledge — not general internet knowledge." },
      { step: "02", title: "Decide", desc: "Based on your defined rules and permissions, the agent decides what should happen next, and whether it's allowed to act on its own." },
      { step: "03", title: "Act", desc: "Within its permitted boundaries, the agent performs the action — updating a system, sending a message, creating a record — through approved integrations." },
      { step: "04", title: "Verify", desc: "The agent checks that the action actually completed correctly before considering the task done." },
      { step: "05", title: "Escalate", desc: "When a request falls outside its permissions, confidence, or scope, the agent hands it to the right person with full context — instead of guessing." },
    ],

    security_eyebrow: "Security & Control",
    security_h2: "Security & Control, By Design",
    security_sub: "This is where a production AI agent earns trust — not by promising perfection, but by being built with real boundaries.",
    security_points: [
      { title: "Approved Knowledge Only", desc: "Agents answer and act using knowledge you've reviewed and approved, not open-ended internet content." },
      { title: "Least-Privilege Tool Access", desc: "Each agent is only given access to the specific systems and actions it actually needs — nothing more." },
      { title: "Validation Before Action", desc: "Inputs and requested actions are checked against defined rules before anything is executed." },
      { title: "Human Approval Where Required", desc: "Sensitive or high-impact actions can be routed for human sign-off before they happen." },
      { title: "Audit & Logging", desc: "Every decision and action an agent takes is logged, so you can review exactly what happened and why." },
      { title: "Reliable Failure Handling", desc: "When something is uncertain, unavailable, or out of scope, the agent fails safely and escalates rather than guessing." },
    ],

    usecases_eyebrow: "Use Cases",
    usecases_h2: "UAE Business Use Cases",
    usecases_sub: "Built for UAE SMEs, service businesses, clinics, professional services, education and training providers, and operations teams looking to automate real workflows — not just add a chat widget.",
    usecases: [
      { title: "Customer Service", desc: "An AI agent answers grounded, company-specific questions from customers and escalates anything it can't confidently resolve to your team." },
      { title: "Lead Qualification", desc: "A new enquiry is captured, qualified against your criteria, logged in your CRM, and queued for the right follow-up." },
      { title: "Appointments", desc: "A WhatsApp enquiry checks real availability, books the appointment, and sends a confirmation and reminder." },
      { title: "Operations", desc: "Incoming requests or documents are read, classified, routed to the right process, and used to update your systems." },
      { title: "Internal Knowledge", desc: "Employees ask questions against your approved internal knowledge instead of searching through scattered documents." },
      { title: "Business Reporting", desc: "Approved data is collected and summarized into a report, routed to the right person on schedule." },
    ],

    process_eyebrow: "Implementation",
    process_h2: "How We Build It",
    process: [
      { step: "01", title: "Discover", desc: "We map your current workflow, systems, and where an agent can genuinely help." },
      { step: "02", title: "Design", desc: "We define exactly what the agent is allowed to know, decide, and do — including escalation rules." },
      { step: "03", title: "Build", desc: "We build the agent against your approved knowledge and the integrations it needs." },
      { step: "04", title: "Test", desc: "We test real scenarios, including edge cases and failure paths, before anything goes live." },
      { step: "05", title: "Deploy", desc: "The agent goes live within the agreed boundaries, with logging and oversight in place." },
      { step: "06", title: "Improve", desc: "We refine the agent's knowledge and rules based on real usage." },
    ],

    faq_eyebrow: "FAQ",
    faq_h2: "Common Questions",
    faq: [
      { q: "What is an AI agent?", a: "An AI agent is a system that can understand a request, decide what to do about it within defined boundaries, take action through your approved systems, verify the result, and escalate to a person when needed — rather than only generating a reply." },
      { q: "How is an AI agent different from a chatbot?", a: "A chatbot typically responds to messages. A production AI agent can also make bounded decisions and take real actions in your systems, under permissions you define." },
      { q: "Can an AI agent connect to our existing systems?", a: "Yes, where an integration is technically possible and you approve the access. Agents are built to work through defined, permitted integrations rather than broad, unrestricted access." },
      { q: "Can AI agents work with WhatsApp?", a: "Yes. WhatsApp is a common channel for enquiries, appointment booking, and customer communication in the UAE, and can be connected as one of an agent's approved channels." },
      { q: "Can the system hand conversations to employees?", a: "Yes — escalation to a human is a core part of how these agents are designed, not an afterthought." },
      { q: "How do you control what an AI agent is allowed to do?", a: "Through explicit permission boundaries defined during the design phase, covering what the agent can know, decide, and act on, and what always requires human approval." },
      { q: "How long does an AI automation project take?", a: "Timelines depend on the complexity of the workflow and the systems being integrated. We define a realistic timeline together during the Discover and Design phases rather than quoting a fixed duration upfront." },
    ],

    cta_h2: "Ready to Automate a Real Workflow?",
    cta_sub: "Tell us about the process you want to improve — we'll assess whether an AI agent is the right fit, and what it would take.",
    cta_btn: "Discuss Your AI Workflow",
  },

  whatsappAutomation: {
    hero_eyebrow: "WhatsApp Automation & AI Agents",
    hero_h1: "WhatsApp Automation & AI Agents for UAE Businesses",
    hero_sub: "Turn WhatsApp conversations into controlled business workflows — answer questions, qualify leads, book appointments, update business systems, follow up, and escalate to your team when needed.",
    hero_cta1: "Discuss Your WhatsApp Workflow",
    hero_cta2: "See What You Can Automate",

    compare_h2: "Beyond a Simple Chatbot",
    compare_chatbot_label: "A Simple Chatbot",
    compare_chatbot_desc: "Responds to predefined questions and fixed conversation flows, with no real understanding of context or your business systems.",
    compare_agent_label: "An AI-Powered WhatsApp Workflow",
    compare_agent_desc: "Understands natural messages, uses your approved business knowledge, collects the information it needs, calls permitted business tools, performs approved actions, records the outcome, and escalates to a person when necessary — with humans always in control.",

    automate_eyebrow: "Capabilities",
    automate_h2: "What Can Be Automated",
    automate_sub: "Real WhatsApp workflows we build for UAE businesses.",
    automate_cards: [
      { title: "Customer Enquiries", desc: "Grounded answers to common questions, using your approved business information." },
      { title: "Lead Capture & Qualification", desc: "Collects requirements and identifies the appropriate next step for each enquiry." },
      { title: "Appointment Booking", desc: "Checks permitted availability and books or reschedules where a calendar is integrated, with confirmations and reminders." },
      { title: "CRM Integration", desc: "Creates or updates leads and customer records through controlled integrations with your CRM." },
      { title: "Follow-Ups", desc: "Approved reminders and follow-up messages, consistent with WhatsApp's platform rules on outbound messaging." },
      { title: "Human Handoff", desc: "Escalates sensitive, complex, uncertain, or explicitly requested cases to your team." },
    ],

    workflow_eyebrow: "Example Workflow",
    workflow_h2: "From Message to Verified Outcome",
    workflow_sub: "The same Understand → Decide → Act → Verify → Escalate architecture behind every ZentexAI agent, applied to WhatsApp.",
    workflow_steps: [
      "Customer sends a WhatsApp message",
      "The AI agent understands the request",
      "It retrieves approved business knowledge",
      "It decides whether an approved action is required",
      "It uses a permitted tool — CRM, calendar, or business API",
      "It verifies the result",
      "It responds, or escalates to a human",
    ],

    crm_eyebrow: "CRM Integration",
    crm_h2: "What \"CRM Integration\" Actually Means",
    crm_p1: "CRM stands for Customer Relationship Management — the system your sales or support team already uses to track leads and customers.",
    crm_p2: "A customer messages on WhatsApp. The automation collects their name, company, requirement, contact information, and lead source. If approved and integrated, it then creates or updates the corresponding lead in your CRM.",
    crm_p3: "This reduces duplicate manual entry and helps your team pick up the conversation with full context, instead of starting from zero.",
    crm_note: "CRM and calendar connections are integrations ZentexAI designs around your specific systems and requirements through supported APIs — not a fixed, one-size-fits-all connector list.",

    booking_eyebrow: "Appointment Booking",
    booking_h2: "Appointment Booking on WhatsApp",
    booking_sub: "A realistic flow for clinics, consultancies, professional services, education and training providers, and other appointment-based businesses.",
    booking_steps: [
      "Customer asks for an appointment",
      "Agent collects the required information",
      "Checks your connected calendar or booking system",
      "Presents available options",
      "Customer selects a time",
      "Booking is created",
      "Confirmation is sent",
      "Reminder workflow runs",
      "Escalates to a human when required",
    ],

    lang_h2: "Built for Arabic and English Conversations",
    lang_p: "Multilingual workflows can be designed for UAE businesses, including both Arabic and English interactions. As with any AI system, accuracy depends on the specific language, dialect, and business context — we don't claim perfect understanding of every dialect, and human escalation stays available for anything the agent isn't confident about.",

    platform_h2: "Built on the Official WhatsApp Business Platform",
    platform_p: "Production WhatsApp automation should run on the official WhatsApp Business Platform, not unofficial methods that risk your business number being restricted. The platform has its own rules around business messaging, including approved templates for outbound messages sent outside the customer service window — we design workflows that respect those rules rather than work around them.",

    security_eyebrow: "Security & Control",
    security_h2: "Security & Control, By Design",
    security_sub: "The same discipline behind every ZentexAI agent, applied to your WhatsApp number and connected systems.",
    security_points: [
      { title: "Approved Knowledge Sources", desc: "The agent answers using knowledge you've reviewed, not open-ended internet content." },
      { title: "Tool Permission Boundaries", desc: "Access to your CRM, calendar, or other systems is limited to exactly what the workflow needs." },
      { title: "Input & Output Validation", desc: "Messages and requested actions are checked against defined rules before anything is executed." },
      { title: "Least-Privilege Access", desc: "Integrations are scoped narrowly, not given broad, account-wide access." },
      { title: "Human Approval for Sensitive Actions", desc: "High-impact actions can require human sign-off before they happen." },
      { title: "Logging & Observability", desc: "Conversations and actions are logged so you can review exactly what happened." },
      { title: "Reliable Failure Handling", desc: "When something is uncertain or unavailable, the agent fails safely and escalates." },
      { title: "Controlled CRM & Calendar Access", desc: "The agent only reads and writes the specific records it's permitted to." },
    ],

    usecases_eyebrow: "UAE Use Cases",
    usecases_h2: "Built for Real UAE Workflows",
    usecases_sub: "Examples of the kind of WhatsApp workflows we design — not case studies, but the categories of work these systems handle well.",
    usecases: [
      { title: "Clinics", desc: "Appointment enquiries, booking requests, reminders, and escalation to staff for anything requiring medical judgment." },
      { title: "Professional Services", desc: "Lead qualification and consultation booking for law firms, accounting practices, and similar advisory businesses." },
      { title: "Education & Training", desc: "Course enquiries, registration guidance, and support escalation for training providers." },
      { title: "Service Businesses", desc: "Quote and request intake, lead routing, and follow-up for salons, repair services, and similar businesses." },
      { title: "Operations & Customer Support", desc: "Status enquiries, approved information, and case routing for support teams." },
    ],

    process_eyebrow: "Implementation",
    process_h2: "How We Build It",
    process_sub: "Scope depends on workflow complexity, the number of integrations, your business rules, approval requirements, WhatsApp setup, and your existing systems — so we define a realistic plan together rather than assuming a fixed template.",
    process: [
      { step: "01", title: "Discover", desc: "We understand your business, customers, and current WhatsApp conversations." },
      { step: "02", title: "Map Workflow", desc: "We map exactly what should happen, step by step, for each type of enquiry." },
      { step: "03", title: "Design Controls", desc: "We define what the agent can know, decide, and do — and what always needs a human." },
      { step: "04", title: "Integrate", desc: "We connect the WhatsApp Business Platform and the specific systems your workflow needs." },
      { step: "05", title: "Test", desc: "We test real scenarios, including edge cases and escalation paths, before going live." },
      { step: "06", title: "Deploy", desc: "The workflow goes live within agreed boundaries, with logging and oversight in place." },
      { step: "07", title: "Improve", desc: "We refine the workflow's knowledge and rules based on real conversations." },
    ],

    faq_eyebrow: "FAQ",
    faq_h2: "Common Questions",
    faq: [
      { q: "What is WhatsApp automation?", a: "WhatsApp automation uses software (and, for more advanced cases, an AI agent) to handle parts of a WhatsApp conversation — answering questions, collecting information, or performing approved actions — without a person handling every message manually." },
      { q: "What is the difference between WhatsApp automation and a chatbot?", a: "A basic chatbot follows fixed, predefined flows. AI-powered WhatsApp automation understands natural messages, uses your approved knowledge, and can take bounded actions in your systems, escalating to a person when needed." },
      { q: "Can an AI agent respond to customers on WhatsApp?", a: "Yes — within the knowledge and permissions you approve, and with a clear path to a human for anything outside that scope." },
      { q: "Can WhatsApp automation connect to our CRM?", a: "Yes, where an integration is technically possible and you approve the access. We design CRM and calendar connections around your specific systems through supported APIs." },
      { q: "Can customers book appointments through WhatsApp?", a: "Yes, where your calendar or booking system is integrated — the agent checks real availability and creates the booking directly in the conversation." },
      { q: "Can employees take over a conversation?", a: "Yes — human handoff is a core part of the design, not an afterthought. Sensitive, complex, or explicitly requested cases are escalated with full context." },
      { q: "Can the AI answer in Arabic and English?", a: "Multilingual workflows can be designed for both Arabic and English. Accuracy depends on the specific language and context, so we don't claim perfect handling of every dialect." },
      { q: "Do we need WhatsApp Business API?", a: "Production automation should run on the official WhatsApp Business Platform rather than unofficial methods, which can put your business number at risk. We help determine the right setup for your business." },
      { q: "How do you control what the AI agent is allowed to do?", a: "Through explicit permission boundaries defined during the design phase — covering what the agent can know, decide, and act on, and what always requires human approval." },
      { q: "How long does implementation take?", a: "Timelines depend on workflow complexity, the number of integrations, and your WhatsApp setup. We define a realistic timeline together during the Discover and Map Workflow phases rather than quoting a fixed duration upfront." },
    ],

    cta_h2: "Ready to Automate Your WhatsApp Conversations?",
    cta_sub: "Tell us how customers currently reach you on WhatsApp — we'll assess what's worth automating and what should stay with your team.",
    cta_btn: "Discuss Your WhatsApp Workflow",
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
      titles: ["Founder & CEO, ZentexAI", "Electrical Engineer", "PMP® Certified Project Management Professional", "MSc in Artificial Intelligence"],
      bio: "Zaid Al-Badareen is the Founder and CEO of ZentexAI, an AI solutions and project management consulting company focused on helping organizations adopt practical artificial intelligence and deliver successful projects. He holds a Bachelor's degree in Electrical Engineering, is a PMP® certified project management professional, and holds a Master of Science (MSc) in Artificial Intelligence. Through ZentexAI, he combines engineering, project management, and AI expertise to help organizations implement practical AI solutions while supporting professionals in developing the project management skills needed to succeed in today's rapidly evolving workplace.",
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
      title: "Account created successfully",
      sub: "We've sent a verification link to",
      sub_after_email: ". Please verify your email, then return to ZentexAI and log in.",
      sub_generic: "We've sent a verification link to your email. Please verify your email, then return to ZentexAI and log in.",
      resend_btn: "Resend email", resend_loading: "Sending...",
      resend_success: "Verification email sent again.",
      back_to_login: "Go to Login",
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
      email_not_confirmed: "Please verify your email before logging in.",
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
      not_ready: "This quiz isn't available yet. Please check back soon.",
      locked: "Complete all lessons in this module to unlock the quiz.",
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
      take_quiz: "Take Module Quiz",
      retake_quiz: "Retake Quiz",
      quiz_passed: "Passed",
      quiz_locked: "Locked",
      quiz_locked_hint: "Complete all lessons in this module to unlock the quiz.",
    },
  },

  // ── Academy Commerce (Sprint 10) ────────────────────────────────────────────
  commerce: {
    storefront: {
      eyebrow: "Academy",
      heading: "Courses & Programs",
      sub: "Browse the PMP Mastery Program and PMP Exam Simulator — no account required to look around.",
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
      learn_heading: "What You'll Learn",
      learn_points: [
        "Core PMP foundations, terminology, and exam content areas",
        "Predictive, agile, and hybrid project approaches",
        "The People, Process, and Business Environment domains",
        "The decision-making mindset the PMP exam actually tests",
        "Practical, scenario-based understanding — not memorization",
      ],
      included_structure_label: "{modules} modules · {lessons} video lessons",
      instructor: {
        heading: "Meet Your Instructor",
        name: "Zaid Al-Badareen, PMP®",
        credentials: "Electrical Engineer | PMP® | MSc, Artificial Intelligence",
        role: "Founder & Lead Instructor — ZentexAI",
        bio: "Zaid Al-Badareen is an Electrical Engineer, PMP® certified project management professional, and holds a Master of Science (MSc) in Artificial Intelligence. His background spans engineering, project execution, education, and artificial intelligence. As Founder and Lead Instructor at ZentexAI, he combines practical project experience with modern AI expertise to teach PMP concepts through understanding, decision-making, and realistic project scenarios—not memorization.",
      },
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
      certificate_locked: "Complete all course lessons and pass all module quizzes to earn your Certificate of Completion.",
      certificate_view: "View Certificate",
      certificate_download: "Download Certificate",
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

  // ── Certificate of Completion (Sprint 11) ───────────────────────────────────
  certificate: {
    heading: "Certificate of Completion",
    not_entitled_body: "You need an active PMP Mastery Program enrollment to earn a certificate.",
    not_entitled_cta: "View PMP Mastery Program",
    not_eligible_heading: "Certificate Not Yet Available",
    not_eligible_body: "Complete all course lessons and pass all module quizzes to earn your Certificate of Completion.",
    missing_name_heading: "Add Your Name to Continue",
    missing_name_body: "We need your full name on file before we can issue your certificate.",
    first_name_label: "First name",
    last_name_label: "Last name",
    name_save: "Save and continue",
    name_saving: "Saving...",
    name_error: "Please enter both your first and last name.",
    academy_name: "ZentexAI Academy",
    program_name: "PMP Mastery Program",
    certifies_that: "This certifies that",
    has_completed: "has successfully completed the",
    offered_by: "offered by ZentexAI Academy.",
    issued_on_label: "Issued on",
    certificate_number_label: "Certificate Number",
    instructor_label: "Instructor",
    instructor_name: "Zaid Al-Badareen, PMP®",
    instructor_role: "Founder & Lead Instructor — ZentexAI",
    download_pdf: "Download Certificate",
    preparing_pdf: "Preparing PDF...",
    view_verification: "Verify this certificate",
    disclaimer: "This certificate recognizes completion of the ZentexAI Academy PMP Mastery Program. It is not a PMP® or PMI® certification and does not represent PMI-issued credentials or exam eligibility.",
    back_to_dashboard: "Back to Dashboard",
  },
  verify: {
    heading: "Certificate Verification",
    sub: "Enter or follow a certificate link to confirm it was issued by ZentexAI Academy.",
    valid_heading: "Valid Certificate",
    not_found_heading: "Certificate Not Found",
    not_found_body: "We couldn't find a certificate with this number. Please check the number and try again.",
    student_label: "Student",
    course_label: "Course",
    issued_label: "Issued",
    certificate_number_label: "Certificate Number",
    academy_name: "ZentexAI Academy",
  },
};

// ─── Arabic ───────────────────────────────────────────────────────────────────

const ar: Translations = {
  nav: {
    home: "الرئيسية", services: "الخدمات", academy: "الأكاديمية", resources: "الموارد", blog: "المدونة",
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
    region_note: "نخدم المؤسسات والمهنيين في دولة الإمارات العربية المتحدة ومنطقة الشرق الأوسط وشمال أفريقيا",
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
    founder_summary: "تأسست ZentexAI على يد زيد البدّارين، المؤسس والرئيس التنفيذي — مهندس كهربائي، حاصل على شهادة PMP® في إدارة المشاريع، وحاصل على درجة الماجستير في الذكاء الاصطناعي.",
    founder_btn: "← اقرأ القصة كاملة",

    articles_eyebrow: "الموارد",
    articles_h2: "أحدث المقالات",
    articles_sub: "محتوى عملي في الذكاء الاصطناعي وإدارة المشاريع.",
    articles_empty: "نحن بصدد إعداد أولى مقالاتنا. تفقّد الموقع لاحقاً.",
    articles_view_all: "عرض جميع المقالات",
  },

  // ── Services ─────────────────────────────────────────────────────────────────
  services: {
    hero_eyebrow: "ما نقدمه",
    hero_h1: "الخدمات",
    hero_sub: "حلول ذكاء اصطناعي، واستشارات ذكاء اصطناعي، واستشارات إدارة مشاريع للشركات في دولة الإمارات وعبر المنطقة — مبنية لتحقيق نتائج فعلية، لا مجرد توصيات.",
    categories: [
      {
        id: "ai-solutions",
        title: "حلول الذكاء الاصطناعي",
        desc: "أنظمة ذكاء اصطناعي عملية مبنية لتؤدي عملاً حقيقياً داخل مؤسستك.",
        examples: ["وكلاء ذكاء اصطناعي", "أتمتة سير العمل", "روبوتات محادثة للأعمال", "مساعدات معرفية", "تطبيقات ذكاء اصطناعي مخصصة"],
        learnMoreHref: "/services/ai-agents-automation-uae",
        learnMoreLabel: "اعرف المزيد عن وكلاء الذكاء الاصطناعي والأتمتة ←",
        learnMoreHref2: "/services/whatsapp-automation-uae",
        learnMoreLabel2: "اطّلع على أتمتة واتساب ووكلاء الذكاء الاصطناعي ←",
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

  aiAgentsAutomation: {
    hero_eyebrow: "وكلاء الذكاء الاصطناعي والأتمتة",
    hero_h1: "وكلاء ذكاء اصطناعي وأتمتة أعمال للشركات في دولة الإمارات",
    hero_sub: "وكلاء ذكاء اصطناعي آمنون وجاهزون للإنتاج يربطون المعرفة وسير العمل وأنظمة عملك لتنفيذ مهام معتمدة — مع إشراف بشري حيثما يلزم.",
    hero_cta1: "ناقش سير عملك مع الذكاء الاصطناعي",
    hero_cta2: "استكشف حالات الاستخدام",

    compare_h2: "ليس مجرد روبوت محادثة",
    compare_chatbot_label: "روبوت محادثة بسيط",
    compare_chatbot_desc: "يرد على الرسائل بردود جاهزة أو عامة، مع إدراك محدود لسياق عملك أو بياناته أو أنظمته.",
    compare_agent_label: "وكيل ذكاء اصطناعي جاهز للإنتاج",
    compare_agent_desc: "يفهم السياق باستخدام معرفتك المعتمدة، ويقرر ضمن حدود واضحة، ويستدعي الأنظمة المصرّح له باستخدامها، وينفّذ الإجراء، ويتحقق من النتيجة، ويصعّد الأمر إلى شخص عند الحاجة.",

    automate_eyebrow: "القدرات",
    automate_h2: "ماذا يمكن لـ ZentexAI أتمتته",
    automate_sub: "فئات عمل حقيقية نبني حولها وكلاء الذكاء الاصطناعي — وليست قائمة ميزات عامة.",
    automate_cards: [
      { title: "خدمة العملاء والأسئلة الشائعة", desc: "إجابات مبنية على معرفة معتمدة لأسئلة العملاء الشائعة، مع التصعيد عندما يحتاج السؤال إلى شخص." },
      { title: "استقطاب العملاء المحتملين وتأهيلهم", desc: "يتم استقبال الاستفسارات الجديدة وتأهيلها وفق معاييرك، وتسجيلها للمتابعة." },
      { title: "جدولة المواعيد", desc: "تتحول الاستفسارات إلى مواعيد محجوزة، مع تأكيدات وتذكيرات تلقائية." },
      { title: "معالجة المستندات والطلبات", desc: "تتم قراءة الطلبات أو المستندات الواردة وتصنيفها وتوجيهها إلى العملية الصحيحة." },
      { title: "مساعدة المعرفة الداخلية", desc: "يحصل الموظفون على إجابات من معرفتك الداخلية المعتمدة بدلاً من البحث في مستندات متفرقة." },
      { title: "التقارير وتحديثات الحالة", desc: "يتم جمع البيانات المعتمدة وتلخيصها وتوجيهها إلى الشخص المناسب في موعدها." },
    ],

    how_eyebrow: "كيف يعمل",
    how_h2: "افهم. قرّر. نفّذ. تحقّق. صعّد.",
    how_sub: "نفس النمط المكوّن من خمس خطوات يقوم عليه كل وكيل نبنيه، ويُكيَّف حسب سير عملك وصلاحياتك المعتمدة.",
    how_steps: [
      { step: "01", title: "افهم", desc: "يقرأ الوكيل الطلب أو الرسالة الواردة ويفسّرها باستخدام معرفة عملك المعتمدة — لا معرفة عامة من الإنترنت." },
      { step: "02", title: "قرّر", desc: "بناءً على قواعدك وصلاحياتك المحددة، يقرر الوكيل ما يجب أن يحدث تالياً، وما إذا كان مسموحاً له بالتصرف من تلقاء نفسه." },
      { step: "03", title: "نفّذ", desc: "ضمن حدوده المسموح بها، ينفّذ الوكيل الإجراء — تحديث نظام، إرسال رسالة، إنشاء سجل — عبر التكاملات المعتمدة." },
      { step: "04", title: "تحقّق", desc: "يتأكد الوكيل من أن الإجراء اكتمل فعلاً وبشكل صحيح قبل اعتبار المهمة منتهية." },
      { step: "05", title: "صعّد", desc: "عندما يخرج الطلب عن صلاحياته أو ثقته أو نطاقه، يسلّمه الوكيل إلى الشخص المناسب مع كامل السياق — بدلاً من التخمين." },
    ],

    security_eyebrow: "الأمان والتحكم",
    security_h2: "أمان وتحكم مبنيان بالتصميم",
    security_sub: "هنا يكتسب وكيل الذكاء الاصطناعي الجاهز للإنتاج الثقة — ليس بوعد الكمال، بل ببنائه بحدود حقيقية.",
    security_points: [
      { title: "معرفة معتمدة فقط", desc: "يجيب الوكلاء وينفّذون باستخدام معرفة راجعتها واعتمدتها، لا محتوى مفتوحاً من الإنترنت." },
      { title: "وصول محدود بأقل الصلاحيات", desc: "يُمنح كل وكيل فقط الوصول إلى الأنظمة والإجراءات التي يحتاجها فعلاً — لا أكثر." },
      { title: "التحقق قبل التنفيذ", desc: "يتم فحص المدخلات والإجراءات المطلوبة مقابل قواعد محددة قبل تنفيذ أي شيء." },
      { title: "موافقة بشرية حيثما يلزم", desc: "يمكن توجيه الإجراءات الحساسة أو عالية التأثير للحصول على موافقة بشرية قبل تنفيذها." },
      { title: "التدقيق والتسجيل", desc: "يتم تسجيل كل قرار وإجراء يتخذه الوكيل، لتتمكن من مراجعة ما حدث بالضبط ولماذا." },
      { title: "معالجة موثوقة للأعطال", desc: "عندما يكون الأمر غير مؤكد أو غير متاح أو خارج النطاق، يفشل الوكيل بأمان ويصعّد الأمر بدلاً من التخمين." },
    ],

    usecases_eyebrow: "حالات الاستخدام",
    usecases_h2: "حالات استخدام لشركات في دولة الإمارات",
    usecases_sub: "مبني للشركات الصغيرة والمتوسطة، وشركات الخدمات، والعيادات، والمهن الاحترافية، ومقدمي التعليم والتدريب، وفرق العمليات التي تسعى لأتمتة سير عمل حقيقي — لا مجرد إضافة نافذة محادثة.",
    usecases: [
      { title: "خدمة العملاء", desc: "يجيب وكيل الذكاء الاصطناعي على أسئلة العملاء المبنية على معرفة معتمدة، ويصعّد ما لا يستطيع حله بثقة إلى فريقك." },
      { title: "تأهيل العملاء المحتملين", desc: "يتم استقبال استفسار جديد وتأهيله وفق معاييرك، وتسجيله في نظام إدارة علاقات العملاء، وتوجيهه للمتابعة المناسبة." },
      { title: "المواعيد", desc: "يتحقق استفسار عبر واتساب من التوفر الفعلي، ويحجز الموعد، ويرسل تأكيداً وتذكيراً." },
      { title: "العمليات", desc: "تتم قراءة الطلبات أو المستندات الواردة وتصنيفها وتوجيهها إلى العملية الصحيحة، واستخدامها لتحديث أنظمتك." },
      { title: "المعرفة الداخلية", desc: "يطرح الموظفون أسئلة على معرفتك الداخلية المعتمدة بدلاً من البحث في مستندات متفرقة." },
      { title: "تقارير الأعمال", desc: "يتم جمع البيانات المعتمدة وتلخيصها في تقرير، وتوجيهه إلى الشخص المناسب في موعده." },
    ],

    process_eyebrow: "التنفيذ",
    process_h2: "كيف نبنيه",
    process: [
      { step: "01", title: "الاكتشاف", desc: "نرسم خريطة لسير عملك الحالي وأنظمتك والمواضع التي يمكن للوكيل أن يساعد فيها فعلاً." },
      { step: "02", title: "التصميم", desc: "نحدد بدقة ما يُسمح للوكيل بمعرفته وقراره وتنفيذه — بما في ذلك قواعد التصعيد." },
      { step: "03", title: "البناء", desc: "نبني الوكيل بناءً على معرفتك المعتمدة والتكاملات التي يحتاجها." },
      { step: "04", title: "الاختبار", desc: "نختبر سيناريوهات حقيقية، بما في ذلك الحالات الاستثنائية ومسارات الفشل، قبل أي إطلاق فعلي." },
      { step: "05", title: "الإطلاق", desc: "يبدأ الوكيل العمل ضمن الحدود المتفق عليها، مع تسجيل وإشراف قائمين." },
      { step: "06", title: "التحسين", desc: "نحسّن معرفة الوكيل وقواعده بناءً على الاستخدام الفعلي." },
    ],

    faq_eyebrow: "الأسئلة الشائعة",
    faq_h2: "أسئلة متكررة",
    faq: [
      { q: "ما هو وكيل الذكاء الاصطناعي؟", a: "وكيل الذكاء الاصطناعي هو نظام يستطيع فهم طلب ما، وتقرير ما يجب فعله حياله ضمن حدود محددة، وتنفيذ إجراء عبر أنظمتك المعتمدة، والتحقق من النتيجة، وتصعيد الأمر إلى شخص عند الحاجة — لا الاكتفاء بتوليد رد فقط." },
      { q: "ما الفرق بين وكيل الذكاء الاصطناعي وروبوت المحادثة؟", a: "عادةً ما يرد روبوت المحادثة على الرسائل فقط. أما وكيل الذكاء الاصطناعي الجاهز للإنتاج فيمكنه أيضاً اتخاذ قرارات محدودة وتنفيذ إجراءات حقيقية في أنظمتك، ضمن صلاحيات تحددها أنت." },
      { q: "هل يمكن لوكيل الذكاء الاصطناعي الاتصال بأنظمتنا الحالية؟", a: "نعم، حيثما يكون التكامل ممكناً تقنياً وتوافق أنت على الوصول إليه. يُبنى الوكلاء للعمل عبر تكاملات محددة ومصرّح بها بدلاً من وصول واسع وغير مقيّد." },
      { q: "هل يمكن لوكلاء الذكاء الاصطناعي العمل عبر واتساب؟", a: "نعم. يُعد واتساب قناة شائعة للاستفسارات وحجز المواعيد والتواصل مع العملاء في دولة الإمارات، ويمكن ربطه كإحدى القنوات المعتمدة للوكيل." },
      { q: "هل يمكن للنظام تحويل المحادثات إلى الموظفين؟", a: "نعم — التصعيد إلى شخص هو جزء أساسي من تصميم هذه الوكلاء، وليس فكرة لاحقة." },
      { q: "كيف تتحكمون بما يُسمح لوكيل الذكاء الاصطناعي بفعله؟", a: "من خلال حدود صلاحيات صريحة تُحدد أثناء مرحلة التصميم، تغطي ما يستطيع الوكيل معرفته وتقريره وتنفيذه، وما يتطلب دائماً موافقة بشرية." },
      { q: "كم يستغرق مشروع أتمتة الذكاء الاصطناعي؟", a: "تعتمد المدة الزمنية على تعقيد سير العمل والأنظمة المطلوب ربطها. نحدد جدولاً زمنياً واقعياً معاً خلال مرحلتي الاكتشاف والتصميم بدلاً من تحديد مدة ثابتة مسبقاً." },
    ],

    cta_h2: "جاهز لأتمتة سير عمل حقيقي؟",
    cta_sub: "أخبرنا عن العملية التي تريد تحسينها — سنقيّم ما إذا كان وكيل الذكاء الاصطناعي هو الحل المناسب، وما يتطلبه ذلك.",
    cta_btn: "ناقش سير عملك مع الذكاء الاصطناعي",
  },

  whatsappAutomation: {
    hero_eyebrow: "أتمتة واتساب ووكلاء الذكاء الاصطناعي",
    hero_h1: "أتمتة واتساب ووكلاء ذكاء اصطناعي للشركات في دولة الإمارات",
    hero_sub: "حوّل محادثات واتساب إلى سير عمل تجاري محكوم — أجب عن الأسئلة، وأهّل العملاء المحتملين، واحجز المواعيد، وحدّث أنظمة عملك، وتابع مع العملاء، وصعّد الأمر إلى فريقك عند الحاجة.",
    hero_cta1: "ناقش سير عمل واتساب الخاص بك",
    hero_cta2: "اطّلع على ما يمكن أتمتته",

    compare_h2: "أبعد من مجرد روبوت محادثة بسيط",
    compare_chatbot_label: "روبوت محادثة بسيط",
    compare_chatbot_desc: "يرد على أسئلة محددة مسبقاً ضمن مسارات محادثة ثابتة، دون فهم حقيقي للسياق أو أنظمة عملك.",
    compare_agent_label: "سير عمل واتساب مدعوم بالذكاء الاصطناعي",
    compare_agent_desc: "يفهم الرسائل الطبيعية، ويستخدم معرفة عملك المعتمدة، ويجمع المعلومات التي يحتاجها، ويستدعي أدوات العمل المصرّح بها، وينفّذ إجراءات معتمدة، ويسجّل النتيجة، ويصعّد الأمر إلى شخص عند الحاجة — مع بقاء البشر في موقع التحكم دائماً.",

    automate_eyebrow: "القدرات",
    automate_h2: "ما الذي يمكن أتمتته",
    automate_sub: "سير عمل حقيقي عبر واتساب نبنيه للشركات في دولة الإمارات.",
    automate_cards: [
      { title: "استفسارات العملاء", desc: "إجابات مبنية على معرفة معتمدة لأسئلة شائعة، باستخدام معلومات عملك المعتمدة." },
      { title: "استقطاب العملاء المحتملين وتأهيلهم", desc: "يجمع المتطلبات ويحدد الخطوة التالية المناسبة لكل استفسار." },
      { title: "حجز المواعيد", desc: "يتحقق من التوفر المسموح به ويحجز أو يعيد الجدولة عند ربط تقويم، مع إرسال تأكيدات وتذكيرات." },
      { title: "التكامل مع نظام إدارة علاقات العملاء", desc: "ينشئ أو يحدّث بيانات العملاء المحتملين والسجلات من خلال تكاملات محكومة مع نظام إدارة علاقات عملائك." },
      { title: "المتابعة", desc: "تذكيرات ورسائل متابعة معتمدة، متوافقة مع قواعد منصة واتساب الخاصة بالرسائل الصادرة." },
      { title: "التحويل إلى موظف", desc: "يصعّد الحالات الحساسة أو المعقدة أو غير المؤكدة أو التي يُطلب فيها ذلك صراحة إلى فريقك." },
    ],

    workflow_eyebrow: "مثال على سير العمل",
    workflow_h2: "من الرسالة إلى نتيجة مُتحقق منها",
    workflow_sub: "نفس بنية افهم ← قرّر ← نفّذ ← تحقّق ← صعّد التي يقوم عليها كل وكيل من ZentexAI، مطبّقة على واتساب.",
    workflow_steps: [
      "يرسل العميل رسالة عبر واتساب",
      "يفهم وكيل الذكاء الاصطناعي الطلب",
      "يستدعي المعرفة التجارية المعتمدة",
      "يقرر ما إذا كان الأمر يتطلب إجراءً معتمداً",
      "يستخدم أداة مصرّح بها — نظام إدارة علاقات العملاء أو التقويم أو واجهة برمجية للأعمال",
      "يتحقق من النتيجة",
      "يرد على العميل، أو يصعّد الأمر إلى شخص",
    ],

    crm_eyebrow: "التكامل مع نظام إدارة علاقات العملاء",
    crm_h2: "ماذا يعني \"التكامل مع نظام إدارة علاقات العملاء\" فعلياً",
    crm_p1: "نظام إدارة علاقات العملاء (CRM) هو النظام الذي يستخدمه فريق المبيعات أو الدعم لديك بالفعل لتتبع العملاء المحتملين والحاليين.",
    crm_p2: "يرسل العميل رسالة عبر واتساب. تجمع الأتمتة اسمه، وشركته، ومتطلباته، وبيانات التواصل، ومصدر العميل المحتمل. وإذا كان ذلك معتمداً ومتكاملاً، تُنشئ أو تحدّث سجل العميل المحتمل في نظام إدارة علاقات العملاء لديك.",
    crm_p3: "هذا يقلل من الإدخال اليدوي المكرر، ويساعد فريقك على متابعة المحادثة بكامل سياقها بدلاً من البدء من الصفر.",
    crm_note: "ربط أنظمة إدارة علاقات العملاء والتقويم هو تكامل تصممه ZentexAI حول أنظمتك ومتطلباتك المحددة من خلال واجهات برمجية مدعومة — وليس قائمة موصلات ثابتة وموحدة لكل الحالات.",

    booking_eyebrow: "حجز المواعيد",
    booking_h2: "حجز المواعيد عبر واتساب",
    booking_sub: "سير عمل واقعي للعيادات والاستشارات والمهن الاحترافية ومقدمي التعليم والتدريب والشركات الأخرى القائمة على المواعيد.",
    booking_steps: [
      "يطلب العميل موعداً",
      "يجمع الوكيل المعلومات المطلوبة",
      "يتحقق من تقويمك أو نظام الحجز المتصل",
      "يعرض الخيارات المتاحة",
      "يختار العميل وقتاً",
      "يتم إنشاء الحجز",
      "يُرسل تأكيد",
      "يعمل سير عمل التذكير",
      "يصعّد الأمر إلى شخص عند الحاجة",
    ],

    lang_h2: "مبني لمحادثات باللغتين العربية والإنجليزية",
    lang_p: "يمكن تصميم سير عمل متعدد اللغات للشركات في دولة الإمارات، بما يشمل التفاعل باللغتين العربية والإنجليزية. وكما هو الحال مع أي نظام ذكاء اصطناعي، تعتمد الدقة على اللغة واللهجة والسياق التجاري المحدد — لا ندّعي فهماً مثالياً لكل لهجة، ويبقى التصعيد إلى شخص متاحاً لأي حالة لا يكون الوكيل واثقاً منها.",

    platform_h2: "مبني على منصة واتساب بزنس الرسمية",
    platform_p: "يجب أن تعمل أتمتة واتساب الإنتاجية على منصة واتساب بزنس الرسمية، لا على طرق غير رسمية قد تعرّض رقم عملك التجاري لخطر التقييد. تمتلك المنصة قواعدها الخاصة المتعلقة بالمراسلة التجارية، بما في ذلك القوالب المعتمدة للرسائل الصادرة خارج نافذة خدمة العملاء — ونحن نصمم سير العمل بما يحترم هذه القواعد بدلاً من الالتفاف عليها.",

    security_eyebrow: "الأمان والتحكم",
    security_h2: "أمان وتحكم مبنيان بالتصميم",
    security_sub: "نفس الانضباط الذي يقوم عليه كل وكيل من ZentexAI، مطبّق على رقم واتساب الخاص بك وأنظمتك المتصلة.",
    security_points: [
      { title: "مصادر معرفة معتمدة", desc: "يجيب الوكيل باستخدام معرفة راجعتها أنت، لا محتوى مفتوحاً من الإنترنت." },
      { title: "حدود صلاحيات الأدوات", desc: "يقتصر الوصول إلى نظام إدارة علاقات العملاء أو التقويم أو الأنظمة الأخرى على ما يحتاجه سير العمل فقط." },
      { title: "التحقق من المدخلات والمخرجات", desc: "يتم فحص الرسائل والإجراءات المطلوبة مقابل قواعد محددة قبل تنفيذ أي شيء." },
      { title: "وصول بأقل الصلاحيات", desc: "تُحدد نطاقات التكاملات بدقة، دون منح وصول واسع على مستوى الحساب بالكامل." },
      { title: "موافقة بشرية للإجراءات الحساسة", desc: "يمكن أن تتطلب الإجراءات عالية التأثير موافقة بشرية قبل تنفيذها." },
      { title: "التسجيل والمراقبة", desc: "يتم تسجيل المحادثات والإجراءات لتتمكن من مراجعة ما حدث بالضبط." },
      { title: "معالجة موثوقة للأعطال", desc: "عندما يكون الأمر غير مؤكد أو غير متاح، يفشل الوكيل بأمان ويصعّد الأمر." },
      { title: "وصول محكوم لنظام إدارة العملاء والتقويم", desc: "لا يقرأ الوكيل أو يكتب إلا السجلات المحددة المصرّح له بها." },
    ],

    usecases_eyebrow: "حالات استخدام في دولة الإمارات",
    usecases_h2: "مبني لسير عمل حقيقي في دولة الإمارات",
    usecases_sub: "أمثلة على نوعية سير عمل واتساب الذي نصممه — وليست دراسات حالة، بل فئات العمل التي تتعامل معها هذه الأنظمة بشكل جيد.",
    usecases: [
      { title: "العيادات", desc: "استفسارات المواعيد وطلبات الحجز والتذكيرات، والتصعيد إلى الموظفين لأي أمر يتطلب حكماً طبياً." },
      { title: "المهن الاحترافية", desc: "تأهيل العملاء المحتملين وحجز الاستشارات لمكاتب المحاماة والمحاسبة والأعمال الاستشارية المماثلة." },
      { title: "التعليم والتدريب", desc: "استفسارات الدورات وإرشادات التسجيل والتصعيد للدعم لدى مقدمي التدريب." },
      { title: "شركات الخدمات", desc: "استقبال طلبات عروض الأسعار وتوجيه العملاء المحتملين والمتابعة لصالونات التجميل وخدمات الإصلاح والأعمال المماثلة." },
      { title: "العمليات ودعم العملاء", desc: "استفسارات الحالة والمعلومات المعتمدة وتوجيه الحالات لفرق الدعم." },
    ],

    process_eyebrow: "التنفيذ",
    process_h2: "كيف نبنيه",
    process_sub: "يعتمد النطاق على تعقيد سير العمل، وعدد التكاملات، وقواعد عملك، ومتطلبات الموافقة، وإعداد واتساب، وأنظمتك الحالية — لذا نحدد خطة واقعية معاً بدلاً من افتراض نموذج ثابت.",
    process: [
      { step: "01", title: "الاكتشاف", desc: "نفهم عملك وعملاءك ومحادثات واتساب الحالية." },
      { step: "02", title: "رسم سير العمل", desc: "نرسم بدقة ما يجب أن يحدث، خطوة بخطوة، لكل نوع من الاستفسارات." },
      { step: "03", title: "تصميم الضوابط", desc: "نحدد ما يستطيع الوكيل معرفته وتقريره وتنفيذه — وما يتطلب دائماً شخصاً." },
      { step: "04", title: "التكامل", desc: "نربط منصة واتساب بزنس والأنظمة المحددة التي يحتاجها سير عملك." },
      { step: "05", title: "الاختبار", desc: "نختبر سيناريوهات حقيقية، بما في ذلك الحالات الاستثنائية ومسارات التصعيد، قبل الإطلاق." },
      { step: "06", title: "الإطلاق", desc: "يبدأ سير العمل ضمن الحدود المتفق عليها، مع تسجيل وإشراف قائمين." },
      { step: "07", title: "التحسين", desc: "نحسّن معرفة سير العمل وقواعده بناءً على محادثات حقيقية." },
    ],

    faq_eyebrow: "الأسئلة الشائعة",
    faq_h2: "أسئلة متكررة",
    faq: [
      { q: "ما هي أتمتة واتساب؟", a: "تستخدم أتمتة واتساب برمجيات (ولحالات أكثر تقدماً، وكيل ذكاء اصطناعي) للتعامل مع أجزاء من محادثة واتساب — الإجابة عن الأسئلة، أو جمع المعلومات، أو تنفيذ إجراءات معتمدة — دون أن يتعامل شخص مع كل رسالة يدوياً." },
      { q: "ما الفرق بين أتمتة واتساب وروبوت المحادثة؟", a: "يتبع روبوت المحادثة الأساسي مسارات ثابتة ومحددة مسبقاً. أما الأتمتة المدعومة بالذكاء الاصطناعي فتفهم الرسائل الطبيعية، وتستخدم معرفتك المعتمدة، ويمكنها اتخاذ إجراءات محدودة في أنظمتك، مع التصعيد إلى شخص عند الحاجة." },
      { q: "هل يمكن لوكيل ذكاء اصطناعي الرد على العملاء عبر واتساب؟", a: "نعم — ضمن المعرفة والصلاحيات التي تعتمدها، ومع مسار واضح للتحويل إلى شخص لأي أمر خارج ذلك النطاق." },
      { q: "هل يمكن لأتمتة واتساب الاتصال بنظام إدارة علاقات العملاء لدينا؟", a: "نعم، حيثما يكون التكامل ممكناً تقنياً وتوافق أنت على الوصول. نصمم روابط نظام إدارة علاقات العملاء والتقويم حول أنظمتك المحددة من خلال واجهات برمجية مدعومة." },
      { q: "هل يمكن للعملاء حجز المواعيد عبر واتساب؟", a: "نعم، حيثما يكون تقويمك أو نظام الحجز متكاملاً — يتحقق الوكيل من التوفر الفعلي وينشئ الحجز مباشرة ضمن المحادثة." },
      { q: "هل يمكن للموظفين تولي المحادثة؟", a: "نعم — التحويل إلى موظف جزء أساسي من التصميم، وليس فكرة لاحقة. تُصعَّد الحالات الحساسة أو المعقدة أو التي يُطلب فيها ذلك صراحة مع كامل السياق." },
      { q: "هل يمكن للذكاء الاصطناعي الرد باللغتين العربية والإنجليزية؟", a: "يمكن تصميم سير عمل متعدد اللغات للعربية والإنجليزية معاً. تعتمد الدقة على اللغة والسياق المحدد، لذا لا ندّعي تعاملاً مثالياً مع كل لهجة." },
      { q: "هل نحتاج إلى واجهة واتساب بزنس البرمجية؟", a: "يجب أن تعمل الأتمتة الإنتاجية على منصة واتساب بزنس الرسمية بدلاً من طرق غير رسمية قد تعرّض رقم عملك للخطر. نساعدك على تحديد الإعداد المناسب لعملك." },
      { q: "كيف تتحكمون بما يُسمح لوكيل الذكاء الاصطناعي بفعله؟", a: "من خلال حدود صلاحيات صريحة تُحدد أثناء مرحلة التصميم، تغطي ما يستطيع الوكيل معرفته وتقريره وتنفيذه، وما يتطلب دائماً موافقة بشرية." },
      { q: "كم يستغرق التنفيذ؟", a: "تعتمد المدة الزمنية على تعقيد سير العمل، وعدد التكاملات، وإعداد واتساب لديك. نحدد جدولاً زمنياً واقعياً معاً خلال مرحلتي الاكتشاف ورسم سير العمل بدلاً من تحديد مدة ثابتة مسبقاً." },
    ],

    cta_h2: "جاهز لأتمتة محادثات واتساب لديك؟",
    cta_sub: "أخبرنا كيف يتواصل معك العملاء حالياً عبر واتساب — سنقيّم ما يستحق الأتمتة وما يجب أن يبقى مع فريقك.",
    cta_btn: "ناقش سير عمل واتساب الخاص بك",
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
      name: "زيد البدّارين",
      titles: ["المؤسس والرئيس التنفيذي، ZentexAI", "مهندس كهربائي", "PMP® - محترف معتمد في إدارة المشاريع", "ماجستير في الذكاء الاصطناعي"],
      bio: "زيد البدّارين هو المؤسس والرئيس التنفيذي لشركة ZentexAI، شركة حلول ذكاء اصطناعي واستشارات إدارة مشاريع تركز على مساعدة المؤسسات على تبني الذكاء الاصطناعي العملي وتسليم مشاريع ناجحة. يحمل درجة البكالوريوس في الهندسة الكهربائية، وهو محترف معتمد PMP® في إدارة المشاريع، وحاصل على درجة الماجستير في الذكاء الاصطناعي. من خلال ZentexAI، يجمع بين خبرته الهندسية وخبرته في إدارة المشاريع وتخصصه في الذكاء الاصطناعي لمساعدة المؤسسات على تطبيق حلول ذكاء اصطناعي عملية، ودعم المهنيين في تطوير مهارات إدارة المشاريع اللازمة للنجاح في بيئة العمل سريعة التطور اليوم.",
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
      title: "تم إنشاء حسابك بنجاح",
      sub: "أرسلنا رابط التحقق إلى",
      sub_after_email: ". يرجى تأكيد بريدك الإلكتروني، ثم العودة إلى ZentexAI وتسجيل الدخول.",
      sub_generic: "أرسلنا رابط التحقق إلى بريدك الإلكتروني. يرجى تأكيد بريدك الإلكتروني، ثم العودة إلى ZentexAI وتسجيل الدخول.",
      resend_btn: "إعادة إرسال البريد", resend_loading: "جارٍ الإرسال...",
      resend_success: "تم إرسال بريد التحقق مرة أخرى.",
      back_to_login: "الذهاب إلى تسجيل الدخول",
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
      not_ready: "هذا الاختبار غير متاح بعد. يرجى التحقق مرة أخرى قريباً.",
      locked: "أكمل جميع دروس هذه الوحدة لفتح الاختبار.",
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
      take_quiz: "ابدأ اختبار الوحدة",
      retake_quiz: "إعادة الاختبار",
      quiz_passed: "تم الاجتياز",
      quiz_locked: "مقفل",
      quiz_locked_hint: "أكمل جميع دروس هذه الوحدة لفتح الاختبار.",
    },
  },

  // ── تجارة الأكاديمية (Sprint 10) ────────────────────────────────────────────
  commerce: {
    storefront: {
      eyebrow: "الأكاديمية",
      heading: "الدورات والبرامج",
      sub: "تصفح برنامج احتراف PMP ومحاكي اختبار PMP — دون الحاجة لإنشاء حساب للتصفح.",
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
      learn_heading: "ماذا ستتعلم",
      learn_points: [
        "أساسيات PMP ومصطلحاتها ومجالات محتوى الامتحان",
        "أساليب المشاريع التنبؤية (Predictive) والرشيقة (Agile) والهجينة (Hybrid)",
        "مجالات الأفراد (People) والعمليات (Process) وبيئة الأعمال (Business Environment)",
        "عقلية اتخاذ القرار التي يقيسها امتحان PMP فعلياً",
        "فهم عملي قائم على سيناريوهات واقعية — لا حفظ",
      ],
      included_structure_label: "{modules} وحدات · {lessons} درس فيديو",
      instructor: {
        heading: "تعرّف على مدربك",
        name: "زيد البدارين، PMP®",
        credentials: "مهندس كهرباء | PMP® | ماجستير في الذكاء الاصطناعي",
        role: "المؤسس والمدرب الرئيسي — ZentexAI",
        bio: "زيد البدارين مهندس كهرباء، حاصل على شهادة PMP®، وحاصل على درجة الماجستير في الذكاء الاصطناعي، بخبرة تجمع بين الهندسة وتنفيذ المشاريع والتعليم والذكاء الاصطناعي. بصفته مؤسس ZentexAI ومدربها الرئيسي، يجمع بين الخبرة العملية والمعرفة الحديثة في الذكاء الاصطناعي لتقديم مفاهيم PMP من خلال الفهم، واتخاذ القرار، وتحليل سيناريوهات المشاريع الواقعية بدلًا من الحفظ.",
      },
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
      certificate_locked: "أكمل جميع دروس الدورة واجتز اختبارات الوحدات للحصول على شهادة إتمام الدورة.",
      certificate_view: "عرض الشهادة",
      certificate_download: "تحميل الشهادة",
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

  // ── شهادة إتمام الدورة (Sprint 11) ──────────────────────────────────────────
  certificate: {
    heading: "شهادة إتمام الدورة",
    not_entitled_body: "تحتاج إلى اشتراك فعّال في برنامج PMP Mastery Program للحصول على شهادة.",
    not_entitled_cta: "عرض برنامج PMP Mastery Program",
    not_eligible_heading: "الشهادة غير متاحة بعد",
    not_eligible_body: "أكمل جميع دروس الدورة واجتز اختبارات الوحدات للحصول على شهادة إتمام الدورة.",
    missing_name_heading: "أضف اسمك للمتابعة",
    missing_name_body: "نحتاج إلى اسمك الكامل قبل أن نتمكن من إصدار شهادتك.",
    first_name_label: "الاسم الأول",
    last_name_label: "اسم العائلة",
    name_save: "حفظ والمتابعة",
    name_saving: "جارٍ الحفظ...",
    name_error: "يرجى إدخال الاسم الأول واسم العائلة.",
    academy_name: "ZentexAI Academy",
    program_name: "PMP Mastery Program",
    certifies_that: "تشهد هذه الوثيقة بأن",
    has_completed: "قد أكمل بنجاح برنامج",
    offered_by: "المقدَّم من ZentexAI Academy.",
    issued_on_label: "تاريخ الإصدار",
    certificate_number_label: "رقم الشهادة",
    instructor_label: "المدرّب",
    instructor_name: "زيد البدارين، PMP®",
    instructor_role: "المؤسس والمدرّب الرئيسي — ZentexAI",
    download_pdf: "تحميل الشهادة",
    preparing_pdf: "جارٍ تجهيز ملف PDF...",
    view_verification: "التحقق من هذه الشهادة",
    disclaimer: "تُقرّ هذه الشهادة بإتمام برنامج PMP Mastery Program المقدَّم من ZentexAI Academy. وهي ليست شهادة PMP® أو PMI®، ولا تمثّل اعتماداً صادراً عن PMI أو أهلية لأداء الامتحان.",
    back_to_dashboard: "العودة إلى لوحة التحكم",
  },
  verify: {
    heading: "التحقق من الشهادة",
    sub: "أدخل رقم الشهادة أو اتبع رابطها للتأكد من إصدارها عن ZentexAI Academy.",
    valid_heading: "شهادة صالحة",
    not_found_heading: "الشهادة غير موجودة",
    not_found_body: "لم نتمكن من العثور على شهادة بهذا الرقم. يرجى التحقق من الرقم والمحاولة مرة أخرى.",
    student_label: "الطالب",
    course_label: "الدورة",
    issued_label: "تاريخ الإصدار",
    certificate_number_label: "رقم الشهادة",
    academy_name: "ZentexAI Academy",
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

const translations: Record<Lang, Translations> = { en, ar };
export default translations;

/** Interpolates {placeholder} tokens in a translation string, e.g. tf(t.assessment.sectionComplete.sectionComplete, { n: 1 }) -> "Section 1 Complete". */
export function tf(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
