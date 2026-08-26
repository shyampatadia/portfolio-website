import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Info, X } from "lucide-react";

export function Panel({ title, note, aside, children, flush = false }) {
  return (
    <section className="panel">
      {(title || aside) && (
        <header className="panel-head">
          {title && <h2 className="panel-title">{title}</h2>}
          {note && <span className="panel-note">{note}</span>}
          {aside && <div className="panel-note-right">{aside}</div>}
        </header>
      )}
      <div className={flush ? "panel-body-flush" : "panel-body"}>{children}</div>
    </section>
  );
}

const deltaIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

export function Stat({ label, value, foot, delta }) {
  const Icon = delta ? deltaIcon[delta.dir] : null;

  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-foot">
        {delta && (
          <span className="stat-delta" data-dir={delta.dir}>
            {Icon && <Icon size={11} style={{ display: "inline", verticalAlign: "-1px" }} />}
            {delta.label}
          </span>
        )}
        {delta && foot ? " · " : ""}
        {foot}
      </span>
    </div>
  );
}

export function Skeleton({ height = 16, width = "100%", style }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}

// Skeletons mirror the shape of what is coming, so the layout does not jump.
export function PanelSkeleton({ rows = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <Skeleton height={11} width={`${58 + ((index * 13) % 30)}%`} />
          <Skeleton height={6} />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
      {action}
    </div>
  );
}

export function ErrorNotice({ error, onRetry }) {
  const offline = error?.offline;

  return (
    <div className="notice notice-error">
      <AlertTriangle />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span>{error?.message || "Something went wrong."}</span>
        {offline && (
          <span style={{ opacity: 0.85 }}>
            Start it with <code>uvicorn app.main:app --reload</code> in the backend directory.
          </span>
        )}
        {onRetry && (
          <div>
            <button type="button" className="btn" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Notice({ children, tone = "plain", icon = true }) {
  const className = tone === "accent" ? "notice notice-accent" : "notice";
  return (
    <div className={className}>
      {icon && <Info />}
      <div>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, id }) {
  return (
    <label className="switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      {label}
    </label>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={toast.tone === "error" ? "toast toast-error" : "toast"}>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.run();
                onDismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
