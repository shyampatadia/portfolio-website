import { ChevronDown, Languages, MapPin, Timer } from "lucide-react";

import { aboutContent } from "@/content/portfolioContent";
import { SectionHeading } from "@/components/SectionHeading";

const factIcons = {
  "Based in": MapPin,
  Languages,
  Experience: Timer,
};

export function AboutSection() {
  return (
    <section className="about-layout">
      <SectionHeading
        eyebrow={aboutContent.kicker}
        title={aboutContent.heading}
        description="Technical background, operating style, and the environments where the work has been most useful."
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
          <p className="about-lead">{aboutContent.paragraphs[0]}</p>
          <div className="about-copy-list">
            {aboutContent.paragraphs.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>

      <details className="about-principles">
        <summary>
          <span>
            <strong>Working principles</strong>
            <small>Secondary context</small>
          </span>
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="about-principle-list">
          {aboutContent.themes.map((item, index) => (
            <div key={item} className="about-principle">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
