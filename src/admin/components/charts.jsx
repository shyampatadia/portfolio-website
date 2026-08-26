import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { num } from "@/admin/lib/format";

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width ?? 0;
      setWidth(next);
    });
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

function niceCeiling(value) {
  if (value <= 5) return Math.max(1, Math.ceil(value));
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/*
  Single-series trend. One measure, one axis: per the dataviz rules there is no
  second y-scale here, ever. Hover gives a crosshair and tooltip; arrow keys move
  the same cursor so the values are reachable without a pointer, and the same
  numbers are mirrored into a screen-reader table below.
*/
export function TrendChart({ points, label = "Unique visitors", height = 190 }) {
  const [wrapRef, width] = useElementWidth();
  const [cursor, setCursor] = useState(null);

  const pad = { top: 14, right: 12, bottom: 22, left: 34 };
  const innerWidth = Math.max(0, width - pad.left - pad.right);
  const innerHeight = height - pad.top - pad.bottom;

  const max = niceCeiling(Math.max(1, ...points.map((point) => point.value)));
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const xOf = useCallback((index) => pad.left + index * stepX, [pad.left, stepX]);
  const yOf = useCallback(
    (value) => pad.top + innerHeight - (value / max) * innerHeight,
    [pad.top, innerHeight, max],
  );

  // Whole-number ticks only, deduplicated: a max of 1 must not print "1, 1, 0".
  const ticks = useMemo(() => {
    const candidates = max <= 2 ? [0, max] : [0, max / 2, max];
    const seen = new Set();
    return candidates
      .map((value) => Math.round(value))
      .filter((value) => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }, [max]);

  const line = points.map((point, index) => `${xOf(index)},${yOf(point.value)}`).join(" ");
  const area =
    points.length > 1
      ? `M ${xOf(0)},${pad.top + innerHeight} L ${points
          .map((point, index) => `${xOf(index)},${yOf(point.value)}`)
          .join(" L ")} L ${xOf(points.length - 1)},${pad.top + innerHeight} Z`
      : "";

  const moveCursor = (event) => {
    if (!innerWidth || points.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left - pad.left;
    const index = Math.round(offset / stepX);
    setCursor(Math.min(points.length - 1, Math.max(0, index)));
  };

  const onKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setCursor((current) => {
      const start = current ?? points.length - 1;
      const next = event.key === "ArrowLeft" ? start - 1 : start + 1;
      return Math.min(points.length - 1, Math.max(0, next));
    });
  };

  const active = cursor === null ? null : points[cursor];
  const tipLeft = cursor === null ? 0 : Math.min(Math.max(xOf(cursor), 60), Math.max(60, width - 60));

  return (
    <div className="trend" ref={wrapRef}>
      {width > 0 && (
        <svg
          height={height}
          width={width}
          role="img"
          aria-label={`${label} over ${points.length} days`}
          tabIndex={0}
          onMouseMove={moveCursor}
          onMouseLeave={() => setCursor(null)}
          onFocus={() => setCursor(points.length - 1)}
          onBlur={() => setCursor(null)}
          onKeyDown={onKeyDown}
        >
          {ticks.map((tick) => {
            const y = yOf(tick);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke={tick === 0 ? "var(--baseline)" : "var(--grid)"}
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
                <text x={0} y={y + 3.5} fontSize="10" fill="var(--axis-ink)">
                  {num(tick)}
                </text>
              </g>
            );
          })}

          {area && <path d={area} fill="var(--series-1)" opacity="0.12" />}

          {points.length > 1 && (
            <polyline
              points={line}
              fill="none"
              stroke="var(--series-1)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.length === 1 && (
            <circle cx={xOf(0)} cy={yOf(points[0].value)} r="4.5" fill="var(--series-1)" />
          )}

          {cursor !== null && (
            <g>
              <line
                x1={xOf(cursor)}
                x2={xOf(cursor)}
                y1={pad.top}
                y2={pad.top + innerHeight}
                stroke="var(--line-strong)"
                strokeWidth="1"
              />
              <circle
                cx={xOf(cursor)}
                cy={yOf(active.value)}
                r="4.5"
                fill="var(--series-1)"
                stroke="var(--chart-surface)"
                strokeWidth="2"
              />
            </g>
          )}

          {points.length > 1 && (
            <>
              <text x={pad.left} y={height - 6} fontSize="10" fill="var(--axis-ink)">
                {points[0].label}
              </text>
              <text
                x={width - pad.right}
                y={height - 6}
                fontSize="10"
                fill="var(--axis-ink)"
                textAnchor="end"
              >
                {points[points.length - 1].label}
              </text>
            </>
          )}
        </svg>
      )}

      {active && (
        <div className="trend-tip" style={{ left: tipLeft, top: 0, transform: "translateX(-50%)" }}>
          {active.label}
          <br />
          <b>{num(active.value)}</b> {label.toLowerCase()}
        </div>
      )}

      <table className="sr-only">
        <caption>{label} by day</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{num(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/*
  Magnitude across categories: one hue, never a rainbow. Name and value are
  always visible, which is also the relief the light-mode contrast WARN requires.
*/
export function BarList({ items, total, max: maxOverride, empty = "Nothing recorded yet" }) {
  if (!items.length) return <p className="panel-note">{empty}</p>;

  const max = maxOverride ?? Math.max(...items.map((item) => item.count));

  return (
    <div className="barlist">
      {items.map((item) => (
        <div className="barlist-row" key={item.label}>
          <span className="barlist-name" title={item.label}>
            {item.label}
          </span>
          <span className="barlist-value">
            {num(item.count)}
            {total ? (
              <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>
                {" "}
                · {Math.round((item.count / total) * 100)}%
              </span>
            ) : null}
          </span>
          <span className="barlist-track">
            <span
              className="barlist-fill"
              style={{ width: `${Math.max(2, (item.count / max) * 100)}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

// At most three categorical slots, which is the validated all-pairs limit.
const SPLIT_SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

export function SplitBar({ items, empty = "Nothing recorded yet" }) {
  if (!items.length) return <p className="panel-note">{empty}</p>;

  const top = items.slice(0, 3);
  const rest = items.slice(3);
  const segments = rest.length
    ? [...top, { label: "Other", count: rest.reduce((sum, item) => sum + item.count, 0) }]
    : top;

  const total = segments.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div>
      <div className="splitbar">
        {segments.map((item, index) => (
          <span
            key={item.label}
            className="splitbar-seg"
            style={{
              width: `${(item.count / total) * 100}%`,
              background: SPLIT_SERIES[index] ?? "var(--ink-muted)",
            }}
          />
        ))}
      </div>
      <div className="splitbar-key">
        {segments.map((item, index) => (
          <span className="splitbar-key-item" key={item.label}>
            <span
              className="splitbar-swatch"
              style={{ background: SPLIT_SERIES[index] ?? "var(--ink-muted)" }}
            />
            {item.label} <b>{num(item.count)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

// Clarity's behavioural counts are problems, so they wear status colours with an
// icon and a label, never colour alone.
export function SignalRow({ items }) {
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: item.color,
              flexShrink: 0,
              transform: "translateY(-1px)",
            }}
          />
          <span style={{ fontSize: 12.5, color: "var(--ink-secondary)" }}>{item.label}</span>
          <span
            style={{
              marginLeft: "auto",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 550,
              color: "var(--ink)",
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

