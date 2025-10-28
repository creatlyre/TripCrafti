/**
 * Custom ESLint rule: no-hardcoded-jsx-text
 * Flags raw (non i18n-wrapped) user-facing text inside JSX.
 * Heuristics chosen to keep false positives low.
 *
 * Allowed automatically:
 *  - Length < 3 ("OK", "✓", etc.)
 *  - Pure punctuation / numbers
 *  - Text containing template markers { } (likely dynamic)
 *  - Files in i18n / generated dictionaries (`src/lib/i18n.ts` etc.)
 *  - Strings passed to known translation helpers: t("..."), dictionary.something
 *  - aria-* attribute values and data-* attributes
 *
 * Reported:
 *  - JSXText nodes with at least one alphabetic character and not only whitespace
 *  - Literal string values assigned to JSX attributes like title/placeholder/label (except aria/data/testid)
 *
 * Configuration (optional override via rule options):
 *  {
 *    allow?: string[]; // exact literals to allow
 *    minLength?: number; // default 3
 *    ignoreFiles?: string[]; // glob fragments matched against filename
 *  }
 */

function create(context) {
  const filename = context.getFilename();
  const options = context.options?.[0] || {};
  const allow = new Set(options.allow || []);
  const minLength = typeof options.minLength === 'number' ? options.minLength : 3;
  const ignoreFiles = options.ignoreFiles || ['i18n', 'tests', '.test.', 'node_modules'];
  const ignoreAttributes = new Set([
    'class',
    'className',
    'style',
    'id',
    'name',
    'd', // svg path
    'viewBox',
    // common non-user facing attributes we want to skip entirely
    'fill',
    'stroke',
    'strokeWidth',
    'x',
    'y',
    'cx',
    'cy',
    'r',
    'width',
    'height',
    'xmlns',
    'version',
    ...(options.ignoreAttributes || []),
  ]);

  if (ignoreFiles.some((frag) => filename.includes(frag))) {
    return {}; // skip file
  }

  // A whole string made of space-separated utility-like tokens (tailwind / css utility style)
  const utilityClassStringRe = /^(?:[a-z0-9_:\-[\]/%.!]+\s?)+$/; // allow !important / modifiers
  // Tailwind arbitrary value pattern e.g. w-[120px] text-[#333]
  const tailwindArbitraryRe = /\[[^\]]+\]/;
  // SVG path data: only path commands + numbers / punctuation
  const svgPathRe = /^[MLHVCSQTAZmlhvcsqtaz0-9\s.,-]+$/;
  // Looks like an asset or URL-ish constant
  const assetLikeRe = /^(?:https?:\/\/|\/?[A-Za-z0-9_.-]+\.(?:png|jpe?g|svg|webp|ico)|image\/(?:png|svg\+xml))$/i;
  // Has at least one word with 3+ letters (any unicode letters)
  const hasWordRe = /\p{L}{3,}/u;

  function isTrivial(text) {
    if (!text) return true;
    const trimmed = text.trim();
    if (!trimmed) return true;
    if (allow.has(trimmed)) return true;
    if (trimmed.length < minLength) return true;
    if (/^[\d\p{P}\s]+$/u.test(trimmed)) return true; // only numbers & punctuation
    if (/[{}]/.test(trimmed)) return true; // likely templated / dynamic area
    if (utilityClassStringRe.test(trimmed)) return true; // pure utility classes
    if (tailwindArbitraryRe.test(trimmed) && !hasWordRe.test(trimmed)) return true;
    if (svgPathRe.test(trimmed) && !hasWordRe.test(trimmed)) return true; // path data only
    if (assetLikeRe.test(trimmed)) return true; // asset or MIME literal
    // If it has no real >=3 letter word, skip (filters out short utility fragments)
    if (!hasWordRe.test(trimmed)) return true;
    return false;
  }

  function report(node, value) {
    context.report({
      node,
      message: `Hardcoded JSX text: "${value.slice(0, 80)}"` + (value.length > 80 ? '…' : ''),
    });
  }

  return {
    JSXText(node) {
      const raw = node.value;
      if (!raw) return;
      const normalized = raw.replace(/\s+/g, ' ');
      if (isTrivial(normalized)) return;
      // Ignore if inside an element explicitly marked to skip
      let parent = node.parent;
      if (parent && parent.openingElement) {
        const name = parent.openingElement.name && parent.openingElement.name.name;
        if (name === 'style' || name === 'script') return;
      }
      // If this text is solely whitespace or part of formatting inside a tag, skip
      if (!/\p{L}/u.test(normalized)) return;
      // Additional guard: if the text matches a utility class pattern (which can appear as raw JSXText
      // due to formatting or accidental splitting), treat as trivial.
      const trimmed = normalized.trim();
      if (utilityClassStringRe.test(trimmed)) return;
      if (tailwindArbitraryRe.test(trimmed) && !hasWordRe.test(trimmed)) return;
      // Basic heuristic: contains a letter (any locale) -> report
      if (/\p{L}/u.test(normalized) && !isTrivial(normalized)) {
        report(node, normalized.trim());
      }
    },
    JSXAttribute(node) {
      const attrName = node.name && node.name.name;
      if (!attrName) return;
      if (/^(aria-|data-|on|testid|role$)/i.test(attrName)) return; // skip accessibility + data
      if (ignoreAttributes.has(attrName)) return; // structural / svg / identifiers
      if (!node.value) return;
      if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
        const val = node.value.value.trim();
        if (isTrivial(val)) return;
        // Skip dictionary.* patterns when passed as strings (rare but defensive)
        if (/^(dictionary\.|t\(|[A-Z_]+)$/i.test(val)) return;
        if (/\p{L}/u.test(val) && !isTrivial(val)) {
          report(node, val);
        }
      }
    },
    CallExpression(node) {
      // Skip translation helper calls so that inner strings aren't flagged again elsewhere.
      const callee = node.callee;
      if (callee.type === 'Identifier' && callee.name === 't') {
        // Do nothing; just prevents future extension
      }
    },
  };
}

export default {
  meta: {
    name: 'no-hardcoded-jsx-text',
    version: '1.0.0',
    type: 'problem',
    docs: {
      description: 'Disallow user-facing hardcoded JSX text literals (i18n enforcement)',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
          minLength: { type: 'number' },
          ignoreFiles: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      default: 'Hardcoded JSX text not allowed',
    },
  },
  create,
};
