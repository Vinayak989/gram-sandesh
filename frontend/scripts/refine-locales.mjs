import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const localeDirectory = resolve(projectRoot, "src/locales");
const languageTargets = {
  as: "as", bn: "bn", brx: "as", doi: "doi", gu: "gu", hi: "hi", kn: "kn", ks: "ur",
  kok: "kok", mai: "mai", ml: "ml", mni: "mni-Mtei", ne: "ne", or: "or", pa: "pa",
  sa: "sa", sat: "sat", sd: "sd", ta: "ta", te: "te", ur: "ur", en: "en",
};

async function translateBatch(values, target) {
  const text = values.map((value, index) => `QZK${String(index).padStart(4, "0")}QZ ${value} QZK${String(index).padStart(4, "0")}END`).join("\n");
  const params = new URLSearchParams({ client: "gtx", sl: "en", tl: target, dt: "t", q: text });
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, { signal: AbortSignal.timeout(25000) });
    if (response.status === 429 && attempt < 3) {
      await new Promise((done) => setTimeout(done, 5000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`Translation returned HTTP ${response.status} for ${target}`);
    const result = await response.json();
    const translatedText = (result?.[0] || []).map((part) => part?.[0] || "").join("");
    const translated = new Map();
    for (const match of translatedText.matchAll(/QZK(\d{4})QZ\s*([\s\S]*?)\s*QZK\1END/g)) translated.set(Number(match[1]), match[2].replace(/\s+/g, " ").trim());
    return values.map((value, index) => translated.get(index) || value);
  }
  throw new Error(`Translation retries exhausted for ${target}`);
}

function batch(values, limit = 850) {
  const groups = [];
  let group = [];
  let length = 0;
  for (const value of values) {
    if (group.length && length + value.length > limit) { groups.push(group); group = []; length = 0; }
    group.push(value);
    length += value.length;
  }
  if (group.length) groups.push(group);
  return groups;
}

const english = JSON.parse(await readFile(resolve(localeDirectory, "en.json"), "utf8"));
for (const [locale, target] of Object.entries(languageTargets)) {
  const path = resolve(localeDirectory, `${locale}.json`);
  const catalog = JSON.parse(await readFile(path, "utf8"));
  const pending = [
    ...Object.entries(catalog.phrases)
      .filter(([source, current]) => source === current)
      .map(([source]) => ({ group: "phrases", source, english: english.phrases[source] || source })),
    ...Object.entries(catalog.words)
      .filter(([source, current]) => source === current)
      .map(([source]) => ({ group: "words", source, english: english.words[source] || source })),
  ];
  const groups = batch(pending.map((item) => item.english));
  let offset = 0;
  for (const values of groups) {
    const improved = await translateBatch(values, target);
    values.forEach((_, index) => {
      const entry = pending[offset + index];
      const candidate = improved[index];
      if (candidate && candidate !== entry.english) catalog[entry.group][entry.source] = candidate;
      else catalog[entry.group][entry.source] = entry.english;
    });
    offset += values.length;
    await new Promise((done) => setTimeout(done, 300));
  }
  await writeFile(path, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log(`Refined ${locale}: ${pending.length} entries via English.`);
}
