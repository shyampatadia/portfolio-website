import { ArrowRight, Code2, Download, Link2, Mail } from "lucide-react";

import TextRotate from "@/components/fancy/text/text-rotate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroContent } from "@/content/portfolioContent";

export function Hero({ onPrimaryAction }) {
  return (
    <section className="hero-shell">
      <div className="hero-texture" aria-hidden="true" />
      <div className="hero-profile">
        <div className="hero-main">
          <div className="hero-title-row">
            <div>
              <p className="section-kicker">Portfolio</p>
              <h1 className="hero-name">{heroContent.name}</h1>
              <p className="hero-role">{heroContent.role}</p>
            </div>
            <p className="hero-location">Worcester, Massachusetts</p>
          </div>

          <div className="hero-summary">
            <p className="hero-statement">
              I build dependable AI and automation systems for teams that need the work to
              survive real constraints.
            </p>
            <p className="type-body-lg">
              {heroContent.intro}
            </p>
          </div>

          <div className="hero-rotator" aria-label="Focus areas">
            <span>Focused on</span>
            <TextRotate
              texts={heroContent.highlights}
              as="span"
              splitBy="words"
              rotationInterval={2400}
              staggerDuration={0.012}
              mainClassName="hero-rotator-word"
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

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
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/shyampatadia/" target="_blank" rel="noreferrer">
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
            <a href={heroContent.emailHref}>
              <Mail className="h-4 w-4" />
              Email
            </a>
          </div>
        </div>

        <aside className="hero-side">
          <div className="hero-portrait">
            <img
              src={heroContent.portrait}
              alt={heroContent.name}
              className="object-center"
            />
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
