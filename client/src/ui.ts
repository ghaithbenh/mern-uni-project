// Classes Tailwind partagées pour garder les composants cohérents.

export const cx = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(' ');

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

const inputFocus =
  'focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';

export const muted = 'text-ink-soft';

/** Libellé éditorial en petites capitales. */
export const eyebrow =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-accent';

export const card = 'rounded-lg border border-rule bg-card shadow-card';

export const panelTitle = 'font-serif text-[17px] font-semibold text-ink';

export const button = `inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-ink px-3.5 text-sm font-medium text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const buttonPrimarySmall = `inline-flex h-8 items-center justify-center rounded-md bg-ink px-3 text-xs font-medium text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const buttonSecondary = `inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rule bg-card px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const buttonSecondarySmall = `inline-flex h-8 items-center justify-center rounded-md border border-rule bg-card px-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/25 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const linkGhost = `inline-flex cursor-pointer items-center rounded-md px-1.5 py-1 text-sm font-medium text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export const linkDanger = `inline-flex cursor-pointer items-center rounded-md px-1.5 py-1 font-medium text-danger underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export const labelField = 'block text-sm font-medium text-ink';

export const field = `mt-1.5 block h-10 w-full rounded-md border border-rule bg-paper/60 px-3 text-sm text-ink placeholder:text-ink-soft ${inputFocus}`;

export const fieldSmall = `block h-9 w-full rounded-md border border-rule bg-paper/60 px-3 text-sm text-ink ${inputFocus}`;

export const fieldArea = `mt-1.5 block w-full resize-y rounded-md border border-rule bg-paper/60 px-3 py-2 text-sm text-ink placeholder:text-ink-soft ${inputFocus}`;

export const fieldSelect = `h-9 rounded-md border border-rule bg-paper/60 px-2.5 text-sm text-ink ${inputFocus}`;

export const fieldSelectSmall = `h-7 rounded-md border border-rule bg-paper/60 px-2 text-xs text-ink ${inputFocus}`;

export const badge =
  'inline-flex items-center rounded-full border border-rule bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft';

export const badgeAccent =
  'inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-ink';
