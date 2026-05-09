import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { SkillIcon } from "@/components/SkillIcon";
import { experienceContent } from "@/content/portfolioContent";

const XLM_LOGO =
  "https://cdn.prod.website-files.com/6772727ca500299a8b9f0feb/6772727ca500299a8b9f10db_xLM%20Logo%20blue%20text.svg";

const companyFocus = [
  "Regulated validation",
  "AI-assisted testing",
  "Cloud delivery",
];

function achievementGroupLabel(index) {
  if (index === 0) return { label: "Impact", tone: "impact" };
  if (index === 1) return { label: "Systems", tone: "systems" };
  if (index === 2) return { label: "Delivery", tone: "delivery" };
  if (index === 3) return { label: "Scale", tone: "scale" };
  return { label: "Operations", tone: "operations" };
}

export function ExperienceSection() {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Professional arc"
        title="Experience"
        description="AI platform design, test automation, validation, and delivery in regulated environments."
      />

      <div className="experience-company-panel">
        <div className="experience-company-logo">
          <img src={XLM_LOGO} alt="xLM Continuous Validation logo" loading="lazy" />
        </div>
        <div className="experience-company-copy">
          <p className="experience-company-label">Company record</p>
          <h3>xLM Continuous Validation</h3>
          <p>
            Four years across regulated validation, automation platforms, AI-assisted testing,
            release governance, and cloud delivery.
          </p>
          <div className="experience-company-facts">
            <span>
              <CalendarDays aria-hidden="true" />
              2021-2025
            </span>
            <span>
              <MapPin aria-hidden="true" />
              Jacksonville, FL
            </span>
          </div>
        </div>
        <ul className="experience-company-focus" aria-label="Company focus areas">
          {companyFocus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

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
                <div>
                  <p className="experience-record-label">Role record</p>
                  <h3 className="type-card-title">
                    {role.title}
                  </h3>
                </div>
                <p className="experience-summary">
                  {role.summary}
                </p>
              </div>

              <ul className="achievement-list">
                {role.achievements.map((item, achievementIndex) => {
                  const group = achievementGroupLabel(achievementIndex);

                  return (
                    <li key={item} className={`achievement-item is-${group.tone}`}>
                      <CheckCircle2 className="achievement-icon" />
                      <span>
                        <strong>{group.label}</strong>
                        {item}
                      </span>
                    </li>
                  );
                })}
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
