import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceFiles = ["src/App.jsx", "index.html"];
const languageTargets = [
  ["as", "as"], ["bn", "bn"], ["brx", "as"], ["doi", "doi"], ["gu", "gu"],
  ["hi", "hi"], ["kn", "kn"], ["ks", "ur"], ["kok", "kok"], ["mai", "mai"],
  ["ml", "ml"], ["mni", "mni-Mtei"], ["ne", "ne"], ["or", "or"], ["pa", "pa"],
  ["sa", "sa"], ["sat", "sat"], ["sd", "sd"], ["ta", "ta"], ["te", "te"],
  ["ur", "ur"], ["en", "en"],
];
const devText = /\p{Script=Devanagari}/u;
const lettersAndNumbers = /[\p{L}\p{N}\p{M}]/u;

function normalize(value) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function addSourceText(values, value) {
  const normalized = normalize(value);
  if (normalized && devText.test(normalized)) values.add(normalized);
}

const phrases = new Set();
for (const relativePath of sourceFiles) {
  const content = await readFile(resolve(projectRoot, relativePath), "utf8");
  const quotedStrings = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  for (const match of content.matchAll(quotedStrings)) addSourceText(phrases, match[0].slice(1, -1));

  const jsxText = />([^<>\{\}]*\p{Script=Devanagari}[^<>\{\}]*?)</gu;
  for (const match of content.matchAll(jsxText)) addSourceText(phrases, match[1]);

  const templates = /`([^`\n]*)`/g;
  for (const match of content.matchAll(templates)) {
    if (match[1].includes("<") || match[1].includes(">")) continue;
    for (const part of match[1].split(/\$\{[^}]*\}/)) addSourceText(phrases, part);
  }
}

const words = new Set();
for (const phrase of phrases) {
  for (const token of phrase.split(/\s+/)) {
    const word = token.replace(/^[^\p{L}\p{N}\p{M}]+|[^\p{L}\p{N}\p{M}]+$/gu, "");
    if (word && devText.test(word)) words.add(word);
  }
}
const sourceTexts = [...new Set([...phrases, ...words])];

function makeBatches(values, maxCharacters = 950) {
  const batches = [];
  let batch = [];
  let size = 0;
  for (const value of values) {
    if (batch.length && size + value.length > maxCharacters) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(value);
    size += value.length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function translateBatch(values, target) {
  const text = values.map((value, index) => `QZK${String(index).padStart(4, "0")}QZ ${value} QZK${String(index).padStart(4, "0")}END`).join("\n");
  const params = new URLSearchParams({ client: "gtx", sl: "mr", tl: target, dt: "t", q: text });
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) {
        const error = new Error(`Translation service returned HTTP ${response.status}`);
        error.retryDelay = Number(response.headers.get("retry-after")) * 1000 || (response.status === 429 ? 10000 : 0);
        throw error;
      }
      const result = await response.json();
      const translatedText = (result?.[0] || []).map((part) => part?.[0] || "").join("");
      const translated = new Map();
      const markerPattern = /QZK(\d{4})QZ\s*([\s\S]*?)\s*QZK\1END/g;
      for (const match of translatedText.matchAll(markerPattern)) translated.set(Number(match[1]), normalize(match[2]));
      if (translated.size !== values.length) console.warn(`Used source text for ${values.length - translated.size} unmatched phrases (${target}).`);
      return values.map((value, index) => translated.get(index) || value);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((done) => setTimeout(done, lastError.retryDelay || 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function runPool(tasks, limit) {
  let index = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (index < tasks.length) {
      const current = index++;
      await tasks[current]();
      await new Promise((done) => setTimeout(done, 350));
    }
  });
  await Promise.all(workers);
}

const batches = makeBatches(sourceTexts);
const localeDirectory = resolve(projectRoot, "src/locales");
await mkdir(localeDirectory, { recursive: true });
await writeFile(resolve(localeDirectory, "mr.json"), JSON.stringify({ phrases: {}, words: {} }, null, 2) + "\n", "utf8");

for (const [locale, target] of languageTargets) {
  const translations = new Map();
  const tasks = batches.map((batch) => async () => {
    const output = await translateBatch(batch, target);
    batch.forEach((source, index) => translations.set(source, output[index]));
  });
  await runPool(tasks, 1);
  const phraseTranslations = Object.fromEntries([...phrases].map((source) => [source, translations.get(source) || source]));
  const wordTranslations = Object.fromEntries([...words].map((source) => [source, translations.get(source) || source]));
  await writeFile(resolve(localeDirectory, `${locale}.json`), JSON.stringify({ phrases: phraseTranslations, words: wordTranslations }, null, 2) + "\n", "utf8");
  console.log(`Generated ${locale} (${target})`);
}

console.log(`Generated ${languageTargets.length + 1} language catalogs from ${phrases.size} UI phrases.`);
