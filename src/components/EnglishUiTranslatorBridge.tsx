import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { hasCjk, translateZhToEn } from '../utils/enUiTranslator';

interface StoredText {
  raw: string;
  translated: string;
}

const TEXT_ORIGINALS = new WeakMap<Text, StoredText>();
const ATTR_ORIGINALS = new WeakMap<Element, Map<string, StoredText>>();
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);

let originalDocTitle: StoredText | null = null;

function isInsidePreservedSubtree(node: Node | null): boolean {
  let curr: Node | null = node;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as Element;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.getAttribute('data-i18n-preserve') === 'true') return true;
      // Do not rewrite user-editable contenteditable regions
      if (el.getAttribute('contenteditable') === 'true') return true;
    }
    curr = curr.parentNode;
  }
  return false;
}

function translateTextNode(textNode: Text): void {
  const current = textNode.nodeValue;
  if (!current || !hasCjk(current)) return;
  if (isInsidePreservedSubtree(textNode.parentNode)) return;

  const prev = TEXT_ORIGINALS.get(textNode);
  if (prev && current === prev.translated) return;

  const translated = translateZhToEn(current);
  if (translated !== current) {
    TEXT_ORIGINALS.set(textNode, { raw: current, translated });
    textNode.nodeValue = translated;
  }
}

function translateElementAttrs(el: Element): void {
  if (el.getAttribute('data-i18n-preserve') === 'true') return;
  if (SKIP_TAGS.has(el.tagName) && el.tagName !== 'TEXTAREA') return;

  for (const attr of TRANSLATABLE_ATTRS) {
    const val = el.getAttribute(attr);
    if (!val || !hasCjk(val)) continue;
    let map = ATTR_ORIGINALS.get(el);
    const prev = map?.get(attr);
    if (prev && val === prev.translated) continue;

    const translated = translateZhToEn(val);
    if (translated !== val) {
      if (!map) {
        map = new Map();
        ATTR_ORIGINALS.set(el, map);
      }
      map.set(attr, { raw: val, translated });
      el.setAttribute(attr, translated);
    }
  }
}

function translateSubtree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element;
    if (el.getAttribute('data-i18n-preserve') === 'true') return;
    translateElementAttrs(el);
  }

  // Translate all descendant text nodes (including SVG <text> / <tspan> & <option>)
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = textWalker.nextNode();
  while (node) {
    translateTextNode(node as Text);
    node = textWalker.nextNode();
  }

  // Translate attributes on descendant elements
  if (root.nodeType === Node.ELEMENT_NODE) {
    const elements = (root as Element).querySelectorAll('[placeholder],[title],[aria-label],[alt]');
    for (let i = 0; i < elements.length; i++) {
      translateElementAttrs(elements[i]);
    }
  }
}

function restoreSubtree(root: Node): void {
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = textWalker.nextNode();
  while (node) {
    const textNode = node as Text;
    const saved = TEXT_ORIGINALS.get(textNode);
    if (saved && textNode.nodeValue === saved.translated) {
      textNode.nodeValue = saved.raw;
    }
    TEXT_ORIGINALS.delete(textNode);
    node = textWalker.nextNode();
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    const elements = (root as Element).querySelectorAll('[placeholder],[title],[aria-label],[alt]');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const map = ATTR_ORIGINALS.get(el);
      if (!map) continue;
      for (const [attr, saved] of map.entries()) {
        if (el.getAttribute(attr) === saved.translated) {
          el.setAttribute(attr, saved.raw);
        }
      }
      ATTR_ORIGINALS.delete(el);
    }
  }
}

/**
 * Global, React-safe, reversible DOM localization bridge for English mode.
 * Ensures zero untranslated Traditional Chinese strings leak into the UI
 * across static views, modals, tooltips, charts, and backend API responses.
 */
export function EnglishUiTranslatorBridge() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'zh').toLowerCase();
  const isEn = lang.startsWith('en');

  useEffect(() => {
    const rootEl = document.body;
    if (!rootEl) return;

    document.documentElement.lang = isEn ? 'en' : lang.startsWith('ja') ? 'ja' : 'zh-TW';

    if (!isEn) {
      restoreSubtree(rootEl);
      if (originalDocTitle && document.title === originalDocTitle.translated) {
        document.title = originalDocTitle.raw;
      }
      originalDocTitle = null;
      return;
    }

    // Translate document.title if needed
    if (hasCjk(document.title)) {
      const raw = document.title;
      const translated = translateZhToEn(raw);
      if (translated !== raw) {
        originalDocTitle = { raw, translated };
        document.title = translated;
      }
    }

    // Initial full sweep
    translateSubtree(rootEl);

    // Batched MutationObserver for dynamic updates, modals, charts, and API-driven renders
    const pendingNodes = new Set<Node>();
    let rafId: number | null = null;

    const flush = () => {
      rafId = null;
      pendingNodes.forEach((target) => {
        if (target.isConnected) {
          translateSubtree(target);
        }
      });
      pendingNodes.clear();
    };

    const schedule = (target: Node) => {
      pendingNodes.add(target);
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'characterData' && m.target) {
          schedule(m.target);
        } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          translateElementAttrs(m.target as Element);
        } else if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            schedule(m.addedNodes[j]);
          }
        }
      }
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRS],
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isEn, lang]);

  return null;
}
