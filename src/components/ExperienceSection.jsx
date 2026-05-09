import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { SkillIcon } from "@/components/SkillIcon";
import { experienceContent } from "@/content/portfolioContent";

export function ExperienceSection() {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow={experienceContent.company}
        title="Experience"
        description="Roles spanning AI platform design, test automation, validation, and delivery in regulated environments."
      />

      <div className="experience-timeline">
        {experienceContent.roles.map((role, index) => (
          <article
            key={`${role.title}-${role.range}`}
            className="experience-card"
          >
            <div className="experience-card-meta">
              <p>
                {role.range}
              </p>
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="experience-card-body">
              <div className="experience-card-header">
                <h3 className="type-card-title">
                  {role.title}
                </h3>
                <p className="reading-measure type-body-lg">
                  {role.summary}
                </p>
              </div>

              <ul className="achievement-list">
                {role.achievements.map((item) => (
                  <li
                    key={item}
                    className="achievement-item"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="experience-tech">
                <p className="section-kicker">Technologies</p>
                <div>
                  {role.technologies.map((tech) => (
                    <span key={tech} className="experience-tech-pill">
                      <SkillIcon label={tech} className="h-5 w-5 text-[8px]" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
