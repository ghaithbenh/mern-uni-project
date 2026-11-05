import { useId, useState } from 'react';
import { cx } from '../../ui';
import type { DailyActivity } from '../../types';

interface ActivityChartProps {
  data: DailyActivity[];
}

type SeriesKey = 'users' | 'events' | 'feedbacks';

interface SeriesDef {
  key: SeriesKey;
  label: string;
  color: string;
  width: number;
  /** Style de trait optionnel pour distinguer des séries de même teinte. */
  dash?: string;
}

const WIDTH = 760;
const HEIGHT = 280;
const PADDING = { top: 18, right: 18, bottom: 32, left: 38 };

const SERIES: SeriesDef[] = [
  { key: 'feedbacks', label: 'Avis', color: 'var(--color-accent)', width: 2 },
  { key: 'events', label: 'Annonces', color: 'var(--color-ink)', width: 2 },
  { key: 'users', label: 'Membres', color: 'var(--color-ink-soft)', width: 2 },
];

const niceCeil = (value: number): number => {
  if (value <= 4) return 4;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
};

const formatShort = (day: string): string =>
  new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });

const formatLong = (day: string): string =>
  new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });

export default function ActivityChart({ data }: ActivityChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const fillId = `activity-${useId().replace(/:/g, '')}`;

  if (data.length === 0) {
    return <p className="text-sm text-ink-soft">Aucune activité sur la période.</p>;
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxValue = Math.max(
    1,
    ...data.flatMap((point) => SERIES.map((series) => point[series.key]))
  );
  const max = niceCeil(maxValue);

  const xFor = (index: number): number =>
    data.length <= 1
      ? PADDING.left + innerWidth / 2
      : PADDING.left + (index / (data.length - 1)) * innerWidth;

  const yFor = (value: number): number =>
    PADDING.top + innerHeight - (value / max) * innerHeight;

  const ticks = Array.from({ length: 5 }, (_, index) =>
    Math.round((max / 4) * index)
  );

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const labelIndices = Array.from(
    new Set(
      data
        .map((_, index) => index)
        .filter((index) => index % labelStep === 0 || index === data.length - 1)
    )
  );

  const currentIndex =
    active !== null && active < data.length ? active : data.length - 1;
  const current = data[currentIndex];

  const totals = SERIES.map((series) => ({
    ...series,
    total: data.reduce((sum, point) => sum + point[series.key], 0),
  }));

  const feedbackPoints = data
    .map((point, index) => `${xFor(index)},${yFor(point.feedbacks)}`)
    .join(' ');
  const feedbackArea = [
    `${xFor(0)},${PADDING.top + innerHeight}`,
    feedbackPoints,
    `${xFor(data.length - 1)},${PADDING.top + innerHeight}`,
  ].join(' ');

  return (
    <div className="mt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="text-xs font-medium text-ink">{formatLong(current.date)}</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          {SERIES.map((series) => (
            <span className="inline-flex items-center gap-1.5" key={series.key}>
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: series.color }}
                aria-hidden="true"
              />
              {series.label}
              <span className="font-semibold tabular-nums text-ink">
                {current[series.key]}
              </span>
            </span>
          ))}
        </span>
      </div>

      <svg
        className="block h-auto w-full overflow-visible"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Activité quotidienne : ${totals
          .map((series) => `${series.total} ${series.label.toLowerCase()}`)
          .join(', ')}`}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={`tick-${tick}`}>
            <line
              className="stroke-rule [stroke-dasharray:2_4]"
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <text
              className="fill-ink-soft text-[10px]"
              x={PADDING.left - 8}
              y={yFor(tick) + 4}
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        ))}

        {labelIndices.map((index) => (
          <text
            key={data[index].date}
            className="fill-ink-soft text-[10px]"
            x={xFor(index)}
            y={HEIGHT - 8}
            textAnchor="middle"
          >
            {formatShort(data[index].date)}
          </text>
        ))}

        <polygon points={feedbackArea} fill={`url(#${fillId})`} />

        {SERIES.map((series) => (
          <polyline
            key={series.key}
            points={data
              .map((point, index) => `${xFor(index)},${yFor(point[series.key])}`)
              .join(' ')}
            fill="none"
            stroke={series.color}
            strokeWidth={series.width}
            strokeDasharray={series.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <line
          className="stroke-ink/40 [stroke-dasharray:3_3]"
          x1={xFor(currentIndex)}
          x2={xFor(currentIndex)}
          y1={PADDING.top}
          y2={PADDING.top + innerHeight}
        />

        {SERIES.map((series) => (
          <circle
            key={`dot-${series.key}`}
            cx={xFor(currentIndex)}
            cy={yFor(current[series.key])}
            r="3.5"
            fill={series.color}
          />
        ))}

        {data.map((point, index) => {
          const slot =
            data.length <= 1 ? innerWidth : innerWidth / (data.length - 1);
          const startX = Math.max(
            PADDING.left,
            xFor(index) - slot / 2
          );
          const endX = Math.min(
            WIDTH - PADDING.right,
            xFor(index) + slot / 2
          );

          return (
            <rect
              key={point.date}
              className={cx(
                'fill-transparent focus:outline-none',
                active === index && 'stroke-ink'
              )}
              x={startX}
              y={PADDING.top}
              width={Math.max(1, endX - startX)}
              height={innerHeight}
              tabIndex={0}
              aria-label={`${formatLong(point.date)} : ${point.feedbacks} avis, ${point.events} annonces, ${point.users} membres`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}
