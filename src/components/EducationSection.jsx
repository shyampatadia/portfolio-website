import { BookOpen, CalendarDays, CheckCircle2 } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { educationContent } from "@/content/portfolioContent";
import { Badge } from "@/components/ui/badge";

const educationBrands = {
  "Master of Science in Data Science": {
    shortName: "WPI",
    logo:
      "https://www.wpi.edu/sites/default/files/inline-image/Offices/Marketing-Communications/WPI_Inst_Prim_FulClr.png",
    accent: "wpi",
  },
  "Bachelor of Science in Applied Statistics & Analytics": {
    shortName: "NMIMS",
    logo: "https://www.nmims.edu/images/nmims-university-logo.png",
    accent: "nmims",
  },
};

export function EducationSection() {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Academic foundation"
        title="Education"
        description="Graduate data science work on one side, applied statistics and analytics on the other."
      />

      <div className="education-list">
        {educationContent.map((entry) => (
          <article
            key={entry.degree}
            className={`education-card is-${educationBrands[entry.degree]?.accent ?? "default"}`}
          >
            <header className="education-card-header">
              <div className="education-brand">
                <img
                  src={educationBrands[entry.degree]?.logo}
                  alt={`${educationBrands[entry.degree]?.shortName || "School"} logo`}
                  loading="lazy"
                />
              </div>

              <div className="education-title-block">
                <p className="section-kicker">{educationBrands[entry.degree]?.shortName}</p>
                <h3>{entry.degree}</h3>
                <p>{entry.school}</p>
              </div>

              <div className="education-meta">
                <span>
                  <CalendarDays className="h-4 w-4 text-blue-700" />
                  {entry.range}
                </span>
                <strong>
                  {entry.scoreLabel}: {entry.score}
                </strong>
              </div>
            </header>

            {entry.courses ? (
              <div className="education-courses">
                <p>Notable courses</p>
                <div className="flex flex-wrap gap-2">
                  {entry.courses.map((course) => (
                    <Badge key={course} variant="default" className="px-3.5 py-1.5 text-sm">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="education-card-body">
              <div className="education-main-column">
                {entry.overview ? (
                  <div className="education-summary">
                    <p>{entry.overview}</p>
                    <strong>{entry.spotlight}</strong>
                  </div>
                ) : null}

                {entry.overviewPoints ? (
                  <div className="education-overview-points">
                    <h4>
                      <BookOpen className="h-4 w-4 text-blue-700" />
                      Program overview
                    </h4>
                    <ul>
                      {entry.overviewPoints.map((point) => (
                        <li key={point}>
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="education-focus-column">
                {entry.focusAreas ? (
                  <div className="education-detail-grid">
                    {entry.focusAreas.map((area, index) => (
                      <div
                        key={area.title}
                        className="education-detail"
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h4>{area.title}</h4>
                          <p>{area.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {entry.skillAreas ? (
                  <div className="education-detail-grid">
                    {entry.skillAreas.map((area, index) => (
                      <div
                        key={area.title}
                        className="education-detail"
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h4>{area.title}</h4>
                          <p>{area.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
