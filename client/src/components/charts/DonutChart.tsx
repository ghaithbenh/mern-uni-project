interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
      <svg
        className="h-[148px] w-[148px] shrink-0"
        viewBox="0 0 160 160"
        role="img"
        aria-label={segments
          .map((segment) => `${segment.label} : ${segment.value}`)
          .join(', ')}
      >
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth="20"
        />

        {total > 0 &&
          segments.map((segment) => {
            const length = (segment.value / total) * CIRCUMFERENCE;
            const dashOffset = -offset;
            offset += length;

            if (segment.value === 0) return null;

            return (
              <circle
                key={segment.label}
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth="20"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 80 80)"
              />
            );
          })}

        <text
          x="80"
          y="78"
          textAnchor="middle"
          className="fill-ink font-serif text-2xl font-semibold"
        >
          {centerValue}
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-ink-soft text-[10px] uppercase tracking-[0.08em]"
        >
          {centerLabel}
        </text>
      </svg>

      <ul className="flex flex-col gap-2 text-xs text-ink-soft">
        {segments.map((segment) => (
          <li className="inline-flex items-center gap-2" key={segment.label}>
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: segment.color }}
              aria-hidden="true"
            />
            {segment.label}
            <span className="font-semibold tabular-nums text-ink">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
