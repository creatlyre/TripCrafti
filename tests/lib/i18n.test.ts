import { getDictionary, dictionaries } from '@/lib/i18n';
import { describe, it, expect } from 'vitest';

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