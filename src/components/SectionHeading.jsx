export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? (
          <p className="section-kicker">{eyebrow}</p>
        ) : null}
        <h2 className="type-section-title">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="section-heading-copy">
          {description}
        </p>
      ) : null}
    </div>
  );
}
