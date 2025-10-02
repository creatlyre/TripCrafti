import { describe, it, expect, test } from 'vitest';

import { getDictionary, dictionaries } from '@/lib/i18n';

describe('getDictionary', () => {
  it('returns the English dictionary when "en" is passed', () => {
    const dict = getDictionary('en');
    expect(dict).toEqual(dictionaries.en);
    expect(dict.hero.heading).toBe('Plan smarter. Pack faster. Travel easier.');
  });

  it('returns the Polish dictionary when "pl" is passed', () => {
    const dict = getDictionary('pl');
    expect(dict).toEqual(dictionaries.pl);
    expect(dict.hero.heading).toBe('Planuj mądrze. Pakuj szybciej. Podróżuj wygodniej.');
  });

  it('returns the Polish dictionary as a fallback for an unsupported language', () => {
    // @ts-expect-error - Testing with an unsupported language
    const dict = getDictionary('fr');
    expect(dict).toEqual(dictionaries.pl);
  });

  it('returns the Polish dictionary for a null or undefined language', () => {
    // @ts-expect-error - Testing with null
    const dictForNull = getDictionary(null);
    expect(dictForNull).toEqual(dictionaries.pl);

    // @ts-expect-error - Testing with undefined
    const dictForUndefined = getDictionary(undefined);
    expect(dictForUndefined).toEqual(dictionaries.pl);
  });
});

// NOTE: Heuristic DOM scan for hardcoded strings removed.
// Rationale: Too many false positives and noisy skips. Preferred future approach:
//  1. Introduce an ESLint custom rule that flags JSXText / string literals in
//     components outside an allowed list (e.g. marketing entry points) unless wrapped
//     by a translation helper (t(), dictionary.* access, etc.).
//  2. Maintain explicit translation dictionary coverage via unit tests (the ones above).
//  3. Optionally add a build step to extract untranslated literals (AST-based) if needed.
