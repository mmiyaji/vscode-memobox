import { readFile } from 'node:fs/promises';

const files = [
  'package.nls.json',
  'package.nls.ja.json',
  'README.md',
  'README.ja.md',
];

const suspiciousMojibake = /(邵ｺ|郢ｧ|隴芸闕ｳ|陞ｳ|陜ｨ|・ｿ|・｡蠕・)/;
const japaneseText = /[\u3040-\u30ff\u4e00-\u9fff]/;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readUtf8(path) {
  return readFile(path, 'utf8');
}

async function main() {
  const contents = Object.fromEntries(
    await Promise.all(files.map(async (path) => [path, await readUtf8(path)])),
  );

  const jaNls = JSON.parse(contents['package.nls.ja.json']);

  const requiredJaKeys = [
    'config.paths.title',
    'commands.newMemo.title',
    'commands.openAdmin.title',
    'settings.memodir.description',
    'settings.ai.description',
  ];

  for (const key of requiredJaKeys) {
    const value = jaNls[key];
    assert(typeof value === 'string' && value.length > 0, `Missing Japanese localization for ${key}.`);
    assert(japaneseText.test(value), `Japanese localization for ${key} does not contain Japanese text.`);
    assert(!suspiciousMojibake.test(value), `Japanese localization for ${key} appears mojibake.`);
  }

  const readmeJa = contents['README.ja.md'];
  const requiredJaReadmeSections = [
    '# MemoBox',
    '## 現在のリリース',
    '## 主な機能',
    '## 主なコマンド',
    '## AI',
    '## ライセンス',
  ];

  for (const section of requiredJaReadmeSections) {
    assert(readmeJa.includes(section), `README.ja.md is missing section: ${section}`);
  }

  assert(!suspiciousMojibake.test(readmeJa), 'README.ja.md appears mojibake.');
  assert(contents['README.md'].includes('[Japanese README](./README.ja.md)'), 'README.md must link to README.ja.md near the top.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
