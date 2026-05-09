import { Brain, Cloud, Code2, Database, Server, TestTube2 } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { TechBadge } from "@/components/SkillIcon";
import { skillCategoryMeta } from "@/content/portfolioContent";
import skillData from "@/content/skills.json";

const skillIcons = {
  languages: Code2,
  ai: Brain,
  testing: TestTube2,
  cloud: Cloud,
  data: Database,
  backend: Server,
};

export function SkillsSection() {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Core capabilities"
        title="Skills"
        description="Languages, platforms, and tooling used across AI systems, automation, testing, cloud, and backend work."
      />

      <div className="skills-matrix">
        {skillCategoryMeta.map((category) => {
          const Icon = skillIcons[category.id] || Code2;
          const skills = skillData[category.id] || [];

          return (
            <article key={category.id} className="skill-category-card">
              <header className="skill-category-header">
                <span className="skill-category-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3>{category.label}</h3>
                  <p>{skills.length} tools</p>
                </div>
              </header>

              <div className="skill-badge-list">
                {skills.map((skill) => (
                  <TechBadge key={skill} label={skill} variant="accent" />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
