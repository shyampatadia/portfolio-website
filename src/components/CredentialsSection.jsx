import { useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { credentialsContent } from "@/content/portfolioContent";

function issuerInitials(issuer) {
  return issuer
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function IssuerLogo({ issuer, domain }) {
  const [failed, setFailed] = useState(false);
  const useImage = domain && !failed;

  return (
    <span className="credential-logo" aria-hidden="true">
      {useImage ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        issuerInitials(issuer)
      )}
    </span>
  );
}

export function CredentialsSection() {
  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Credentials"
        title="Continuous learning, with proof"
        description={credentialsContent.intro}
      />

      <div className="credentials-grid">
        {credentialsContent.certifications.map((cert) => (
          <article key={cert.title} className="credential-card">
            <div className="credential-card-header">
              <IssuerLogo issuer={cert.issuer} domain={cert.domain} />
              <div className="credential-year-block">
                <span className="credential-year-value">{cert.issued}</span>
                <span className="credential-year-label">Issued</span>
              </div>
            </div>

            <div>
              <h3 className="credential-title">{cert.title}</h3>
              <p className="credential-issuer">{cert.issuer}</p>
            </div>

            <p className="credential-summary">{cert.summary}</p>

            <div className="credential-tags">
              {cert.tags.map((tag) => (
                <Badge key={tag} variant="subtle">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="credential-footer">
              <span className="credential-validity">
                <ShieldCheck aria-hidden="true" />
                {cert.validity}
              </span>
              <a
                href={cert.verifyHref}
                target="_blank"
                rel="noreferrer"
                className="credential-verify"
              >
                Verify
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="credential-next-panel">
        <p className="section-kicker">What&apos;s next</p>
        <p className="mt-2 reading-measure type-body-sm">
          {credentialsContent.future}
        </p>
      </div>
    </section>
  );
}
