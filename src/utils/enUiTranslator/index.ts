import { EXACT_PHRASES, PRESERVE_NATIVE_STRINGS } from './exactPhrases';
import { DOMAIN_GLOSSARY } from './domainGlossary';
import { CHAR_FALLBACK } from './charFallback';

const CJK_RE = /[\u4e00-\u9fff]/;
const JP_KANA_RE = /[\u3040-\u309f\u30a0-\u30ff]/;

// Compiled Trie for O(N) longest-match phrase lookup
interface TrieNode {
  children: Map<string, TrieNode>;
  value?: string;
}

function buildTrie(dict: Record<string, string>): TrieNode {
  const root: TrieNode = { children: new Map() };
  for (const [key, val] of Object.entries(dict)) {
    if (!key) continue;
    let node = root;
    for (const ch of key) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map() };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.value = val;
  }
  return root;
}

const MERGED_GLOSSARY: Record<string, string> = { ...DOMAIN_GLOSSARY };
for (const [k, v] of Object.entries(EXACT_PHRASES)) {
  if (k.length >= 2 && k.length <= 14 && !k.includes(':') && !(k in MERGED_GLOSSARY)) {
    MERGED_GLOSSARY[k] = v;
  }
}
const PHRASE_TRIE = buildTrie(MERGED_GLOSSARY);

// Memoization cache (bounded to avoid unbounded memory growth)
const CACHE_LIMIT = 12000;
const TRANSLATION_CACHE = new Map<string, string>();

// Acronym-only parentheticals that should NOT replace the Chinese prefix
const SHORT_ACRONYM_RE = /^[A-Z0-9\-\/\.\s:+]{1,6}$/;

/**
 * Clean bilingual parentheticals:
 * 1) "中文標題 (Descriptive English Label)" -> "Descriptive English Label"
 * 2) "English Label (中文補充)" -> "English Label"
 */
function resolveBilingualParentheticals(text: string): string {
  // Case 1: Full string is "<CJK prefix> (<Descriptive English>)"
  const fullZhEn = text.match(/^([^()]*[\u4e00-\u9fff][^()]*?)\s*[（(]([A-Za-z0-9][A-Za-z0-9\s\-\/\.\&\+:,\x27_#]+)[）)]$/);
  if (fullZhEn) {
    const prefix = fullZhEn[1].trim();
    const enPart = fullZhEn[2].trim();
    const idMatch = prefix.match(/^([A-Za-z0-9][A-Za-z0-9\s\-_.]{0,24}:\s*)/);
    const isDescriptive =
      !SHORT_ACRONYM_RE.test(enPart) &&
      (/[a-z]/.test(enPart) || enPart.includes(' ')) &&
      enPart.length >= 3;
    if (isDescriptive) {
      if (idMatch) {
        return `${idMatch[1]}${enPart}`.trim();
      }
      // Preserve leading icon/emoji if present
      const emojiPrefix = prefix.match(/^([^\w\u4e00-\u9fff\s]+\s*)/)?.[1] || '';
      return `${emojiPrefix}${enPart}`.trim();
    }
  }

  // Case 2: "English Label (純中文說明)" -> "English Label"
  let out = text.replace(
    /([A-Za-z][A-Za-z0-9\s\-\/\.\+&]{1,40})\s*[（(]([^()]*[\u4e00-\u9fff][^()]*)[）)]/g,
    (match, enPart: string, zhPart: string) => {
      // Keep if zhPart contains numbers/codes/units that add info not in enPart
      if (/\d/.test(zhPart) || /[A-Za-z]{3,}/.test(zhPart)) return match;
      return enPart.trim();
    }
  );

  // Case 3: Inline "中文 (Descriptive English)" segments separated by | or /
  out = out.replace(
    /([\u4e00-\u9fff][\u4e00-\u9fff\s、與及\/\-]{1,30})\s*[（(]([A-Za-z][A-Za-z0-9\s\-\/\.\&\+:,\x27]{3,50})[）)]/g,
    (match, _zhPart: string, enPart: string) => {
      if (SHORT_ACRONYM_RE.test(enPart.trim())) return match;
      return enPart.trim();
    }
  );

  return out;
}

/**
 * Grammar & parameterized pattern replacements (time, counts, brackets, units).
 */
function applyPatternRules(text: string): string {
  let out = text;

  // Normalize full-width brackets and quotes
  out = out
    .replace(/【([^】]+)】/g, '[$1]')
    .replace(/「([^」]+)」/g, '"$1"')
    .replace(/『([^』]+)』/g, '"$1"')
    .replace(/《([^》]+)》/g, '"$1"')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .replace(/，/g, ', ')
    .replace(/、/g, ', ')
    .replace(/。/g, '. ')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/！/g, '! ')
    .replace(/？/g, '? ')
    .replace(/～/g, ' ~ ')
    .replace(/—/g, ' - ')
    .replace(/·/g, ' • ');

  // Time & relative duration patterns
  out = out
    .replace(/過去\s*(\d+)\s*小時/g, 'Past $1 Hours')
    .replace(/過去\s*(\d+)\s*天/g, 'Past $1 Days')
    .replace(/過去\s*(\d+)\s*分鐘/g, 'Past $1 Minutes')
    .replace(/過去\s*(\d+)\s*秒/g, 'Past $1 Seconds')
    .replace(/未來\s*(\d+)\s*小時內/g, 'Next $1 Hours')
    .replace(/未來\s*(\d+)\s*小時/g, 'Next $1 Hours')
    .replace(/未來\s*(\d+)\s*天/g, 'Next $1 Days')
    .replace(/於\s*(\d+)\s*小時內/g, 'within $1 hours')
    .replace(/(\d+)\s*分鐘內/g, 'within $1 minutes')
    .replace(/(\d+)\s*秒內/g, 'within $1 seconds')
    .replace(/(\d+)\s*小時內/g, 'within $1 hours')
    .replace(/(\d+)\s*天內/g, 'within $1 days')
    .replace(/(\d+)\s*分鐘前/g, '$1m ago')
    .replace(/(\d+)\s*小時前/g, '$1h ago')
    .replace(/(\d+)\s*秒前/g, '$1s ago')
    .replace(/(\d+)\s*天前/g, '$1d ago')
    .replace(/每\s*(\d+)\s*秒/g, 'Every $1s')
    .replace(/每\s*(\d+)\s*分鐘/g, 'Every $1m')
    .replace(/每\s*(\d+)\s*小時/g, 'Every $1h')
    .replace(/剩餘\s*(\d+)\s*秒/g, '$1s remaining')
    .replace(/剩餘\s*(\d+)\s*分鐘/g, '$1m remaining')
    .replace(/耗時\s*([\d.,]+)\s*(ms|s|秒)/gi, 'Elapsed $1$2')
    .replace(/(\d+)\s*筆\s*\/\s*分/g, '$1 events/min')
    .replace(/(\d+)\s*筆\s*\/\s*秒/g, '$1 events/s')
    .replace(/第\s*(\d+)\s*頁/g, 'Page $1')
    .replace(/第\s*(\d+)\s*階段/g, 'Stage $1')
    .replace(/階段\s*([A-Z0-9]+)/g, 'Stage $1')
    .replace(/等級\s*(\d+)/g, 'Tier $1')
    .replace(/共\s*([\d,]+)\s*筆/g, '$1 records')
    .replace(/共\s*([\d,]+)\s*個/g, '$1 items')
    .replace(/共\s*([\d,]+)\s*項/g, '$1 items')
    .replace(/共\s*([\d,]+)\s*台/g, '$1 hosts')
    .replace(/共\s*([\d,]+)\s*條/g, '$1 rules')
    .replace(/([\d,]+)\s*筆/g, '$1 records')
    .replace(/([\d,]+)\s*次/g, '$1 times')
    .replace(/([\d,]+)\s*台/g, '$1 hosts')
    .replace(/([\d,]+)\s*條/g, '$1 rules')
    .replace(/([\d,]+)\s*項/g, '$1 items')
    .replace(/([\d,]+)\s*名/g, '$1 users')
    .replace(/([\d,]+)\s*家/g, '$1 vendors')
    .replace(/([\d,]+)\s*個/g, '$1 ')
    .replace(/([\d,]+)\s*分鐘/g, '$1 min')
    .replace(/([\d,]+)\s*小時/g, '$1 hr')
    .replace(/([\d,]+)\s*秒/g, '$1s')
    .replace(/([\d,]+)\s*天/g, '$1 days')
    .replace(/([\d,]+)\s*分(?![鐘析佈配類層解])/g, '$1 pts');

  return out;
}

/**
 * Trie longest-match translation + character fallback for any remaining CJK spans.
 */
function translateRemainingCjk(text: string): string {
  const parts: string[] = [];
  let i = 0;
  const n = text.length;

  const appendToken = (tok: string, isWord: boolean) => {
    if (!tok) return;
    if (parts.length > 0 && isWord) {
      const prev = parts[parts.length - 1];
      const prevChar = prev[prev.length - 1];
      const firstChar = tok[0];
      if (
        prevChar &&
        firstChar &&
        /[A-Za-z0-9%)\]]/.test(prevChar) &&
        /[A-Za-z0-9(\[]/.test(firstChar)
      ) {
        parts.push(' ');
      }
    }
    parts.push(tok);
  };

  while (i < n) {
    const ch = text[i];
    if (!CJK_RE.test(ch)) {
      // Collect contiguous non-CJK characters
      let j = i + 1;
      while (j < n && !CJK_RE.test(text[j])) j++;
      const chunk = text.slice(i, j);
      appendToken(chunk, /^[A-Za-z0-9]/.test(chunk));
      i = j;
      continue;
    }

    // Trie longest match starting at i
    let node: TrieNode | undefined = PHRASE_TRIE;
    let bestVal: string | undefined;
    let bestEnd = i;

    for (let j = i; j < n; j++) {
      node = node.children.get(text[j]);
      if (!node) break;
      if (node.value !== undefined) {
        bestVal = node.value;
        bestEnd = j + 1;
      }
    }

    if (bestVal !== undefined) {
      appendToken(bestVal, true);
      i = bestEnd;
    } else {
      const fb = CHAR_FALLBACK[ch];
      if (fb !== undefined) {
        appendToken(fb, true);
      } else {
        // Fallback: never emit untranslated CJK
        appendToken('', false);
      }
      i++;
    }
  }

  return parts.join('');
}

function polishEnglishText(text: string): string {
  let out = text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?%)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/(\([A-Za-z0-9\-/+\s]{2,16}\))\s*\1/gi, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/\.\s*\.+/g, (m) => (m.includes('...') ? '...' : '.'))
    .replace(/:\s*:/g, ':')
    .trim();

  // Capitalize first letter if lowercase ascii
  if (/^[a-z]/.test(out)) {
    out = out[0].toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Translates any string containing Traditional Chinese characters into clean English.
 * Preserves pure English strings, Japanese kana strings, and native language labels untouched.
 */
export function translateZhToEn(input: string): string {
  if (!input || !CJK_RE.test(input)) return input;
  if (JP_KANA_RE.test(input)) return input;

  const trimmed = input.trim();
  if (!trimmed || PRESERVE_NATIVE_STRINGS.has(trimmed)) return input;

  const cached = TRANSLATION_CACHE.get(input);
  if (cached !== undefined) return cached;

  const leadingWs = input.match(/^\s*/)?.[0] || '';
  const trailingWs = input.match(/\s*$/)?.[0] || '';

  // Stage 1: Exact dictionary match
  let result = EXACT_PHRASES[trimmed];

  if (result === undefined) {
    // Stage 2: Bilingual parenthetical resolution
    let working = resolveBilingualParentheticals(trimmed);

    // Check exact match again after parenthetical cleanup
    if (EXACT_PHRASES[working] !== undefined) {
      result = EXACT_PHRASES[working];
    } else if (!CJK_RE.test(working)) {
      result = polishEnglishText(working);
    } else {
      // Stage 3: Regex grammar/time/count patterns
      working = applyPatternRules(working);
      // Stage 4 & 5: Trie phrase translation + character fallback
      if (CJK_RE.test(working)) {
        working = translateRemainingCjk(working);
      }
      result = polishEnglishText(working);
    }
  }

  const finalOut = `${leadingWs}${result}${trailingWs}`;

  if (TRANSLATION_CACHE.size >= CACHE_LIMIT) {
    // Evict oldest quarter
    let evicted = 0;
    for (const k of TRANSLATION_CACHE.keys()) {
      TRANSLATION_CACHE.delete(k);
      if (++evicted >= CACHE_LIMIT / 4) break;
    }
  }
  TRANSLATION_CACHE.set(input, finalOut);
  return finalOut;
}

export function hasCjk(text: string | null | undefined): boolean {
  return Boolean(text && CJK_RE.test(text));
}
