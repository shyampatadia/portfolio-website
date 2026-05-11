import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Download,
  Link2,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroContent } from "@/content/portfolioContent";

const heroSignals = [
  {
    label: "AI systems",
    detail: "LLM workflows",
    icon: BrainCircuit,
  },
  {
    label: "Automation",
    detail: "CI/CD and scripts",
    icon: Workflow,
  },
  {
    label: "Validation",
    detail: "GxP delivery",
    icon: ShieldCheck,
  },
];

export function Hero({ onPrimaryAction }) {
  return (
    <section className="hero-shell">
      <div className="hero-profile">
        <div className="hero-main">
          <div className="hero-title-row">
            <div>
              <p className="hero-kicker">Portfolio</p>
              <h1 className="hero-name">{heroContent.name}</h1>
              <p className="hero-role">AI Engineer / Data Scientist / Software Developer</p>
            </div>

            <p className="hero-location">
              <MapPin className="h-4 w-4" />
              Worcester, Massachusetts
            </p>
          </div>

          <div className="hero-summary">
            <p className="hero-statement">
              Dependable <span>AI systems</span> for real-world constraints.
            </p>
            <p className="hero-intro">
              I work across AI systems, automation infrastructure, validation, and engineering
              delivery, turning complex workflows into reliable software teams can trust.
            </p>
          </div>

          <div className="hero-signal-shelf" aria-label="Core strengths">
            {heroSignals.map((signal) => {
              const Icon = signal.icon;

              return (
                <article key={signal.label} className="hero-signal-card">
                  <Icon aria-hidden="true" />
                  <div>
                    <h2>{signal.label}</h2>
                    <p>{signal.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hero-rotator" aria-label="Focus areas">
            <span>Focused on</span>
            <span className="hero-rotator-word">{heroContent.highlights[0]}</span>
          </div>

          <div className="hero-command-row">
            <div className="hero-actions">
              <Button onClick={onPrimaryAction}>
                {heroContent.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" asChild>
                <a href={heroContent.resumeHref}>
                  <Download className="h-4 w-4" />
                  Resume
                </a>
              </Button>
            </div>

            <div className="hero-links" aria-label="External links">
              <a href="https://github.com/shyampatadia" target="_blank" rel="noreferrer">
                <Code2 className="h-4 w-4" />
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/shyampatadia/" target="_blank" rel="noreferrer">
                <Link2 className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
              <a href={heroContent.emailHref}>
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        <aside className="hero-side">
          <div className="hero-portrait">
            <img
              src={heroContent.portrait}
              alt={heroContent.name}
              width="400"
              height="400"
              fetchPriority="high"
            />
            <div className="hero-portrait-tag">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI + automation
            </div>
          </div>

          <div className="hero-note">
            <p className="section-kicker">Open to</p>
            <p>{heroContent.availability}</p>
          </div>

          <div className="hero-highlight-row">
            {heroContent.highlights.map((item) => (
              <Badge key={item} variant="subtle">
                {item}
              </Badge>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
