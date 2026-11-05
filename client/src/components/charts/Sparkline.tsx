interface SparklineProps {
  values: number[];
  color?: string;
  label: string;
}

const WIDTH = 120;
const HEIGHT = 34;

export default function Sparkline({
  values,
  color = 'var(--color-ink)',
  label,
}: SparklineProps) {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;

  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = HEIGHT - 3 - (value / max) * (HEIGHT - 8);
      return `${x},${y}`;
    })
    .join(' ');

  const area = `0,${HEIGHT} ${points} ${(values.length - 1) * step},${HEIGHT}`;

  return (
    <svg
      className="h-8 w-20 shrink-0"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
