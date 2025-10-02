import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Compute remaining daily spend target given remaining amount and trip date window.
// If trip finished returns 0. If not started uses start date as baseline.
export function computeDailySpendTarget(
  remaining: number | null,
  startDate: string,
  endDate: string,
  now: Date = new Date()
): number | null {
  if (remaining == null) return null;
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  if (now > end) return 0; // trip completed
  const current = now < start ? start : now;
  const daysLeft = Math.max(1, Math.round((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24) + 1));
  return remaining / daysLeft;
}
