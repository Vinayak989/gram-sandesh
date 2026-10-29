export const indianLanguages = [
  ["as", "অসমীয়া"], ["bn", "বাংলা"], ["brx", "बड़ो"], ["doi", "डोगरी"],
  ["gu", "ગુજરાતી"], ["hi", "हिन्दी"], ["kn", "ಕನ್ನಡ"], ["ks", "کٲشُر"],
  ["kok", "कोंकणी"], ["mai", "मैथिली"], ["ml", "മലയാളം"], ["mni", "মৈতৈলোন"],
  ["mr", "मराठी"], ["ne", "नेपाली"], ["or", "ଓଡ଼ିଆ"], ["pa", "ਪੰਜਾਬੀ"],
  ["sa", "संस्कृतम्"], ["sat", "ᱥᱟᱱᱛᱟᱲᱤ"], ["sd", "سنڌي"], ["ta", "தமிழ்"],
  ["te", "తెలుగు"], ["ur", "اردو"], ["en", "English"],
];

const localeNames = {
  as: "as-IN", bn: "bn-IN", brx: "brx-IN", doi: "doi-IN", gu: "gu-IN", hi: "hi-IN",
  kn: "kn-IN", ks: "ks-IN", kok: "kok-IN", mai: "mai-IN", ml: "ml-IN", mni: "mni-IN",
  mr: "mr-IN", ne: "ne-IN", or: "or-IN", pa: "pa-IN", sa: "sa-IN", sat: "sat-IN",
  sd: "sd-IN", ta: "ta-IN", te: "te-IN", ur: "ur-IN", en: "en-IN",
};

const localeLoaders = import.meta.glob("./locales/*.json", { import: "default" });
const originalText = new WeakMap();
const translatedText = new WeakMap();
const originalAttributes = new WeakMap();
const translatedAttributes = new WeakMap();
const translatableAttributes = ["aria-label", "placeholder", "title", "alt"];

export function readPreferredLanguage() {
  try {
    const saved = window.localStorage.getItem("gram-sandesh-language");
    return indianLanguages.some(([code]) => code === saved) ? saved : "mr";
  } catch {
    return "mr";
  }
}

export function getIntlLocale() {
  return localeNames[readPreferredLanguage()] || "mr-IN";
}

function normalize(value) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function translate(source, dictionary) {
  const key = normalize(source);
  if (!key) return source;
  const exact = dictionary.phrases?.[key];
  if (exact && exact !== key) return exact;

  const wordMap = dictionary.words || {};
  return source.replace(/\S+/gu, (token) => {
    const match = token.match(/^([^\p{L}\p{N}\p{M}]*)([\p{L}\p{N}\p{M}]+)([^\p{L}\p{N}\p{M}]*)$/u);
    return match ? `${match[1]}${wordMap[match[2]] || match[2]}${match[3]}` : token;
  });
}

function localizeTextNode(node, dictionary) {
  const current = node.nodeValue;
  const lastTranslation = translatedText.get(node);
  const source = lastTranslation === current ? originalText.get(node) : current;
  if (source === undefined) return;
  if (!source.trim()) { originalText.set(node, source); translatedText.set(node, source); return; }

  originalText.set(node, source);
  const leading = source.match(/^\s*/u)?.[0] || "";
  const trailing = source.match(/\s*$/u)?.[0] || "";
  const body = source.slice(leading.length, source.length - trailing.length || undefined);
  const next = `${leading}${translate(body, dictionary)}${trailing}`;
  translatedText.set(node, next);
  if (next !== current) node.nodeValue = next;
}

function localizeAttribute(element, name, dictionary) {
  const current = element.getAttribute(name);
  if (current === null) return;
  let originals = originalAttributes.get(element);
  let translations = translatedAttributes.get(element);
  if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
  if (!translations) { translations = new Map(); translatedAttributes.set(element, translations); }
  const source = translations.get(name) === current ? originals.get(name) : current;
  if (source === undefined) return;
  originals.set(name, source);
  const next = translate(source, dictionary);
  translations.set(name, next);
  if (next !== current) element.setAttribute(name, next);
}

function localizeElement(element, dictionary) {
  if (element.closest?.("[data-no-translate]")) return;
  for (const name of translatableAttributes) localizeAttribute(element, name, dictionary);
  if (element.matches?.('meta[name="description"]')) localizeAttribute(element, "content", dictionary);
}

function localizeTree(root, dictionary) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest("script,style,noscript,textarea,code,[data-no-translate]")) continue;
    localizeTextNode(node, dictionary);
  }
  if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root, dictionary);
  root.querySelectorAll?.("*").forEach((element) => localizeElement(element, dictionary));
}

export function observeUiLanguage(language) {
  let stopped = false;
  let observer;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ur" || language === "ks" ? "rtl" : "ltr";
  const loader = localeLoaders[`./locales/${language}.json`];
  const dictionaryPromise = loader ? loader() : Promise.resolve({ phrases: {}, words: {} });

  dictionaryPromise.then((dictionary) => {
    if (stopped) return;
    localizeTree(document.documentElement, dictionary);
    observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "characterData") {
          if (!change.target.parentElement?.closest("script,style,noscript,textarea,code,[data-no-translate]")) localizeTextNode(change.target, dictionary);
        } else if (change.type === "attributes") {
          localizeAttribute(change.target, change.attributeName, dictionary);
        } else {
          change.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              if (!added.parentElement?.closest("[data-no-translate]")) localizeTextNode(added, dictionary);
            } else if (added.nodeType === Node.ELEMENT_NODE && !added.closest("[data-no-translate]")) localizeTree(added, dictionary);
          });
        }
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes, "content"],
    });
  });

  return () => {
    stopped = true;
    observer?.disconnect();
  };
}
