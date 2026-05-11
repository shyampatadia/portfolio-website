import {
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Cog,
  Languages,
  MapPin,
} from "lucide-react";

import { aboutContent } from "@/content/portfolioContent";
import { SectionHeading } from "@/components/SectionHeading";

const factIcons = {
  "Based in": MapPin,
  Languages,
  Experience: BriefcaseBusiness,
};

const focusIcons = {
  "AI systems": BrainCircuit,
  "Automation infrastructure": Cog,
  "Validation delivery": ClipboardCheck,
};

export function AboutSection() {
  return (
    <section className="about-layout about-layout-pro">
      <SectionHeading
        eyebrow={aboutContent.kicker}
        title={aboutContent.heading}
        description="AI systems, automation infrastructure, and validation delivery."
      />

      <dl className="about-facts">
        {aboutContent.quickFacts.map((fact) => {
          const Icon = factIcons[fact.label] || MapPin;

          return (
            <div key={fact.label} className="about-fact">
              <dt>
                <Icon className="about-fact-icon" />
                <span>{fact.label}</span>
              </dt>
              <dd>{fact.value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="about-statement-band">
        <p>{aboutContent.summary}</p>
      </div>

      <div className="about-focus-list">
        {aboutContent.focusAreas.map((item) => {
          const Icon = focusIcons[item.label] || BrainCircuit;

          return (
            <article key={item.label} className="about-focus-item">
              <div className="about-focus-icon" aria-hidden="true">
                <Icon />
              </div>
              <div>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="about-principles" aria-label="Operating principles">
        <p className="about-principles-title">Operating mode</p>
        <div className="about-principle-list">
          {aboutContent.themes.map((item) => (
            <div key={item.label} className="about-principle">
              <CheckCircle2 className="about-principle-icon" />
              <div>
                <p>{item.label}</p>
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
