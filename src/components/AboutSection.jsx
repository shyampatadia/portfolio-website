import { CheckCircle2, Languages, MapPin, Timer } from "lucide-react";

import { aboutContent } from "@/content/portfolioContent";
import { SectionHeading } from "@/components/SectionHeading";

const factIcons = {
  "Based in": MapPin,
  Languages,
  Experience: Timer,
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
                <Icon className="h-4 w-4 text-blue-700" />
                {fact.label}
              </dt>
              <dd>{fact.value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="about-overview">
        <article className="about-copy-panel">
          <p className="about-lead">{aboutContent.summary}</p>
          <div className="about-focus-list">
            {aboutContent.focusAreas.map((item) => (
              <div key={item.label} className="about-focus-item">
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <aside className="about-principles" aria-label="Operating principles">
        <p className="about-principles-title">Operating mode</p>
        <div className="about-principle-list">
          {aboutContent.themes.map((item) => (
            <div key={item} className="about-principle">
              <CheckCircle2 className="h-4 w-4" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
