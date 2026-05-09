import { ArrowUpRight, Code2 } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { TechBadge } from "@/components/SkillIcon";
import { Button } from "@/components/ui/button";
import { projectsContent } from "@/content/portfolioContent";

function FeaturedCard({ project }) {
  const primaryLink = project.links?.[0];
  const eyebrow = ["Featured", project.category].filter(Boolean).join(" · ");

  return (
    <article className="project-card-featured">
      <div className="project-featured-stack">
        <p className="section-kicker">{eyebrow}</p>

        <h3 className="project-featured-title">
          {primaryLink ? (
            <a href={primaryLink.href} target="_blank" rel="noreferrer">
              <span>{project.title}</span>
              <ArrowUpRight className="mt-1.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            </a>
          ) : (
            project.title
          )}
        </h3>

        <p className="reading-measure type-body">{project.summary}</p>

        {project.metrics?.length ? (
          <div className="project-kpi-strip" role="list">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="project-kpi" role="listitem">
                <span className="project-kpi-value">{metric.value}</span>
                <span className="project-kpi-label">{metric.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {project.achievements?.length ? (
          <ul className="achievement-list">
            {project.achievements.map((item) => (
              <li key={item} className="achievement-item">
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <TechBadge key={tech} label={tech} variant="accent" />
          ))}
        </div>

        {project.links?.length ? (
          <div className="project-link-row">
            {project.links.map((link) => (
              <Button key={link.href} variant="secondary" size="sm" asChild>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CompactCard({ project }) {
  const primaryLink = project.links?.[0];
  const headlineMetric = project.metrics?.[0];

  return (
    <article className="project-card-compact group">
      <p className="section-kicker">{project.category ?? "Project"}</p>

      <div className="project-card-compact-title">
        <h3>
          {primaryLink ? (
            <a href={primaryLink.href} target="_blank" rel="noreferrer">
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h3>
        {primaryLink ? (
          <ArrowUpRight className="project-card-compact-arrow" aria-hidden="true" />
        ) : null}
      </div>

      {headlineMetric ? (
        <p className="project-metric-inline">
          <strong>{headlineMetric.value}</strong>
          <span>{headlineMetric.label}</span>
        </p>
      ) : null}

      <p className="project-summary">{project.summary}</p>

      <div className="project-tech-row">
        {project.technologies.map((tech) => (
          <TechBadge key={tech} label={tech} />
        ))}
      </div>

      {project.links?.length ? (
        <div className="project-link-row">
          {project.links.map((link) => (
            <Button key={link.href} variant="secondary" size="sm" asChild>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ProjectsSection() {
  const featured = projectsContent.find((project) => project.featured) ?? projectsContent[0];
  const rest = projectsContent.filter((project) => project !== featured);

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Selected work"
        title="Projects"
        description="Machine learning systems, agentic workflows, validation tooling, and applied engineering projects that show how I like to build."
      />

      <div className="projects-shell">
        <FeaturedCard project={featured} />
        <div className="projects-grid">
          {rest.map((project) => (
            <CompactCard key={project.title} project={project} />
          ))}
        </div>
      </div>

      <div className="quiet-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="section-kicker">More work</p>
          <p className="mt-3 reading-measure type-body-sm">
            Open-source experiments and smaller utilities tend to appear on GitHub before they
            become long write-ups here.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <a href="https://github.com/shyampatadia" target="_blank" rel="noreferrer">
            <Code2 className="h-4 w-4" />
            Follow on GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}
