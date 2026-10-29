import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const localeDirectory = resolve(import.meta.dirname, "../src/locales");
const phrases = [
  "आधी मजकूर लिहिण्याची जागा निवडा.",
  "या ब्राउझरमध्ये आवाजाने लिहिण्याची सुविधा उपलब्ध नाही.",
  "ऐकत आहे... बोला.",
  "बोललेले शब्द मजकूरात जोडले.",
  "माइकची परवानगी द्या आणि पुन्हा प्रयत्न करा.",
  "आवाज ऐकू आला नाही. पुन्हा प्रयत्न करा.",
  "माइक सुरू करता आला नाही.",
  "बोलणे थांबवा",
  "आवाजाने लिहा",
];
const targets = {
  as: "as", bn: "bn", brx: "as", doi: "doi", gu: "gu", hi: "hi", kn: "kn", ks: "ur",
  kok: "kok", mai: "mai", ml: "ml", mni: "mni-Mtei", ne: "ne", or: "or", pa: "pa",
  sa: "sa", sat: "sat", sd: "sd", ta: "ta", te: "te", ur: "ur", en: "en",
};

async function translateBatch(values, target, sourceLanguage = "mr") {
  const text = values.map((value, index) => `QZK${String(index).padStart(4, "0")}QZ ${value} QZK${String(index).padStart(4, "0")}END`).join("\n");
  const params = new URLSearchParams({ client: "gtx", sl: sourceLanguage, tl: target, dt: "t", q: text });
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      if (response.status === 429 && attempt < 3) { await new Promise((done) => setTimeout(done, 3000 * (attempt + 1))); continue; }
      throw new Error(`Translation returned HTTP ${response.status} for ${target}`);
    }
    const result = await response.json();
    const textResult = (result?.[0] || []).map((part) => part?.[0] || "").join("");
    const translated = new Map();
    for (const match of textResult.matchAll(/QZK(\d{4})QZ\s*([\s\S]*?)\s*QZK\1END/g)) translated.set(Number(match[1]), match[2].replace(/\s+/g, " ").trim());
    return values.map((value, index) => translated.get(index) || value);
  }
  throw new Error(`Translation retries exhausted for ${target}`);
}

const englishCatalog = JSON.parse(await readFile(resolve(localeDirectory, "en.json"), "utf8"));
for (const [locale, target] of Object.entries(targets)) {
  const path = resolve(localeDirectory, `${locale}.json`);
  const catalog = JSON.parse(await readFile(path, "utf8"));
  const translated = locale === "mr" ? phrases : await translateBatch(phrases, target);
  const fallbackIndices = phrases.map((source, index) => source === translated[index] && locale !== "mr" ? index : -1).filter((index) => index >= 0);
  const fallbackSources = fallbackIndices.map((index) => englishCatalog.phrases[phrases[index]] || phrases[index]);
  const fallbackTranslations = fallbackSources.length ? await translateBatch(fallbackSources, target, "en") : [];
  for (let index = 0; index < phrases.length; index++) {
    const source = phrases[index];
    let value = translated[index];
    if (value === source && locale !== "mr") {
      const fallbackIndex = fallbackIndices.indexOf(index);
      value = fallbackTranslations[fallbackIndex] || fallbackSources[fallbackIndex];
    }
    catalog.phrases[source] = value;
  }
  await writeFile(path, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log(`Updated voice labels: ${locale}`);
}
