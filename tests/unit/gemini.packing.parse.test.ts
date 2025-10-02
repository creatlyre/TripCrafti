import { describe, it, expect } from 'vitest';

// We will indirectly test the JSON extraction heuristic by recreating the logic here
// to ensure future refactors can align the behavior. If logic changes in service, adapt test.

const extractJson = (text: string): string => {
  if (!text) throw new Error('Empty AI response');
  let cleaned = text.trim();
  const fenceRegex = /^```[a-zA-Z]*\n([\s\S]*?)```$/m;
  const fenceMatch = cleaned.match(fenceRegex);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) throw new Error('No JSON object found in AI response');
  cleaned = cleaned.slice(firstBrace);
  let depth = 0;
  let endIndex = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  if (endIndex !== -1) {
    cleaned = cleaned.slice(0, endIndex);
  }
  return cleaned;
};

describe('Gemini packing JSON extraction heuristic', () => {
  const minimalJson = {
    meta: {
      destination: 'Test',
      days: 3,
      people: { adults: 2, children: 0 },
      season: 'lato',
      archetype: 'Test Archetype',
    },
    checklist: [{ task: 'Do something', done: false }],
    items: [{ name: 'Paszport', qty: 1, category: 'Dokumenty i Finanse' }],
  };
  const jsonStr = JSON.stringify(minimalJson, null, 2);

  it('parses plain JSON', () => {
    const out = extractJson(jsonStr);
    expect(JSON.parse(out)).toMatchObject(minimalJson);
  });

  it('parses fenced ```json block', () => {
    const wrapped = '```json\n' + jsonStr + '\n```';
    const out = extractJson(wrapped);
    expect(JSON.parse(out)).toMatchObject(minimalJson);
  });

  it('parses fenced generic ``` block', () => {
    const wrapped = '```\n' + jsonStr + '\n```';
    const out = extractJson(wrapped);
    expect(JSON.parse(out)).toMatchObject(minimalJson);
  });

  it('parses with leading explanation text', () => {
    const wrapped = 'Oto wynik:\n\n' + jsonStr;
    const out = extractJson(wrapped);
    expect(JSON.parse(out)).toMatchObject(minimalJson);
  });

  it('parses with trailing commentary after JSON', () => {
    const wrapped = jsonStr + '\nDziękuję!';
    const out = extractJson(wrapped);
    expect(JSON.parse(out)).toMatchObject(minimalJson);
  });

  it('throws when no braces present', () => {
    expect(() => extractJson('Brak JSON tutaj')).toThrow(/No JSON object/);
  });
});
