import type { TrendPoint } from '../domain/rules';

export function TrendChart({
  data,
  baseline,
  threshold,
}: {
  data: TrendPoint[];
  baseline: number;
  threshold: number;
}) {
  const W = 680;
  const H = 220;
  const padL = 32;
  const padB = 28;
  const padT = 12;
  const max = Math.max(...data.map((d) => d.count), threshold, baseline) * 1.15;
  const plotH = H - padB - padT;
  const plotW = W - padL - 8;
  const barW = plotW / data.length - 8;
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Monthly qualifying no-power repairs over 12 months. Historical average ${baseline}, signal threshold ${threshold}. Latest period highlighted.`}
      >
        {/* threshold line */}
        <line x1={padL} x2={W - 8} y1={y(threshold)} y2={y(threshold)} stroke="var(--red)" strokeDasharray="4 3" />
        <text x={W - 8} y={y(threshold) - 4} textAnchor="end" fontSize="10" fill="var(--red)">
          threshold {threshold}
        </text>
        {/* baseline line */}
        <line x1={padL} x2={W - 8} y1={y(baseline)} y2={y(baseline)} stroke="var(--ink-soft)" strokeDasharray="2 2" />
        <text x={W - 8} y={y(baseline) - 4} textAnchor="end" fontSize="10" fill="var(--ink-soft)">
          avg {baseline}
        </text>
        {/* bars */}
        {data.map((d, i) => {
          const x = padL + i * (plotW / data.length) + 4;
          const barH = plotH - (y(d.count) - padT);
          return (
            <g key={d.month} tabIndex={0} focusable="true">
              <title>
                {d.month}: {d.count} qualifying repairs{d.isCurrent ? ' (current 30-day window)' : ''}
              </title>
              <rect
                x={x}
                y={y(d.count)}
                width={barW}
                height={Math.max(barH, 1)}
                fill={d.isCurrent ? 'var(--cobalt)' : '#9fb3c8'}
              />
              <text x={x + barW / 2} y={H - padB + 12} textAnchor="middle" fontSize="8" fill="var(--ink-soft)">
                {d.month.slice(2)}
              </text>
              {d.isCurrent && (
                <text x={x + barW / 2} y={y(d.count) - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--cobalt)">
                  {d.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
        Qualifying no-power R500 PSU-750 repairs per month. Latest 30-day window highlighted in cobalt.
      </figcaption>
    </figure>
  );
}
