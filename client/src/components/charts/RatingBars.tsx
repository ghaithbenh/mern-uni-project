import type { RatingBucket } from '../../types';

interface RatingBarsProps {
  ratings: RatingBucket[];
  average: number | null;
}

export default function RatingBars({ ratings, average }: RatingBarsProps) {
  const max = Math.max(1, ...ratings.map((bucket) => bucket.count));
  const total = ratings.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <div className="mt-4">
      <div className="flex h-36 items-stretch gap-2.5">
        {ratings.map((bucket) => (
          <div
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
            key={bucket.note}
          >
            <span className="text-xs tabular-nums text-ink-soft">{bucket.count}</span>
            <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-md bg-rule/60">
              <div
                className="w-full bg-accent"
                style={{ height: `${(bucket.count / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-soft">{bucket.note}★</span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-baseline gap-2 border-t border-rule pt-3">
        <span className="font-serif text-2xl font-medium">
          {average === null ? '—' : average.toFixed(1)}
        </span>
        <span className="text-xs text-ink-soft">/ 5 · {total} avis</span>
      </p>
    </div>
  );
}
