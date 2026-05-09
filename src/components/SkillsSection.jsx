import { Brain, Cloud, Code2, Database, Server, TestTube2 } from "lucide-react";

import TextRotate from "@/components/fancy/text/text-rotate";
import { SectionHeading } from "@/components/SectionHeading";
import { TechBadge } from "@/components/SkillIcon";
import skillData from "@/content/skills.json";

const skillIcons = {
  languages: Code2,
  ai: Brain,
  backend: Server,
  cloud: Cloud,
  data: Database,
  testing: TestTube2,
};

const categoryDescriptions = {
  languages: "Programming languages and low-level execution tools.",
  ai: "Modeling, retrieval, agents, and applied ML workflows.",
  backend: "Service frameworks used for APIs and application backends.",
  cloud: "Deployment, orchestration, and delivery infrastructure.",
  data: "Databases, analytics tooling, and vector storage.",
  testing: "Automation frameworks and validation tooling.",
};

export function SkillsSection() {
  const totalSkills = Object.values(skillData.skills).reduce(
    (sum, skills) => sum + skills.length,
    0,
  );
  const focusAreas = skillData.categories.map((category) => category.label);

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Core capabilities"
        title="Skills"
        description="A practical map of the languages, platforms, and tooling I use across AI systems, automation, testing, cloud, data, and backend work."
      />

      <div className="skills-hero-panel">
        <div className="skills-orb" aria-hidden="true">
          <span>{totalSkills}</span>
          <small>skills</small>
        </div>
        <div>
          <p className="section-kicker">Current toolkit</p>
          <h3>
            Built around{" "}
            <TextRotate
              texts={focusAreas}
              as="span"
              splitBy="words"
              rotationInterval={1900}
              mainClassName="skills-rotate"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
          </h3>
          <p>
            Instead of hiding the stack behind filters, each lane below keeps the tools visible
            while preserving the shape of the engineering work.
          </p>
        </div>
      </div>

      <div className="skills-atlas">
        {skillData.categories.map((category, index) => {
          const Icon = skillIcons[category.id] || Code2;
          const skills = skillData.skills[category.id] || [];

          return (
            <article key={category.id} className="skill-lane">
              <header className="skill-lane-header">
                <span className="skill-category-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{category.label}</h3>
                  <p>{categoryDescriptions[category.id]}</p>
                </div>
              </header>

              <div className="skill-lane-body">
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
