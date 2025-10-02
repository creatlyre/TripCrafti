import { describe, it, expect } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges basic classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes correctly', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  it('merges conflicting Tailwind classes, with the last one taking precedence', () => {
    // p-4 should be overridden by p-2
    expect(cn('p-4', 'p-2')).toBe('p-2');
    // text-red-500 should be overridden by text-blue-500
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles a mix of strings, objects, and undefined values', () => {
    const hasBg = true;
    const padding = 'p-4';
    expect(cn('font-bold', { 'bg-red-500': hasBg, 'bg-blue-500': !hasBg }, padding, undefined, null, 'mx-2')).toBe(
      'font-bold bg-red-500 p-4 mx-2'
    );
  });
});
