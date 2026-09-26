"use client";

import GovernedFlow from "@/components/flow/GovernedFlow";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import { useLang } from "@/lib/LanguageContext";
import { visualCopy } from "@/lib/visualCopy";

/**
 * The AI Agents page's signature diagram: the governed flow at full size, with
 * the page's own framing text beside it. Same component (and same wording) as
 * the homepage hero, plus a Replay control for anyone who missed the pass.
 */
export default function AgentFlowSection() {
  const { lang } = useLang();
  const c = visualCopy[lang].agent;
  return (
    <Section bordered aria-label={c.heading}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
        <SectionHeader flush eyebrow={c.eyebrow} title={c.heading} description={c.sub} />
        <GovernedFlow showReplay />
      </div>
    </Section>
  );
}
