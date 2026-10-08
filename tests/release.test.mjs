import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { once } from "node:events";
import test from "node:test";
import { prepareRelease, validateBundledFonts } from "../scripts/prepare-release.mjs";

const runtime = new URL("../node_modules/@docviewkit/viewer/", import.meta.url);

test("standalone website release retains the npm runtime and licenses without core source", async (t) => {
  const output = await mkdtemp(resolve(tmpdir(), "docviewkit-website-release-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const revision = "a".repeat(40);
  const result = await prepareRelease({ revision, output });
  const sdk = JSON.parse(await readFile(new URL("package.json", runtime), "utf8"));
  assert.equal(result.viewerVersion, sdk.version);
  assert.notEqual(result.version, sdk.version);
  const stage = resolve(output, "website");
  const copied = resolve(stage, "node_modules/@docviewkit/viewer");
  for (const name of await readdir(runtime, { recursive: true, withFileTypes: true })) {
    if (!name.isFile()) continue;
    const source = resolve(name.parentPath, name.name);
    const relative = source.slice(runtime.pathname.length);
    assert.deepEqual(await readFile(resolve(copied, relative)), await readFile(source), relative);
  }
  await validateBundledFonts(copied);
  const entries = execFileSync("tar", ["-tzf", resolve(output, result.archive)], { encoding: "utf8" });
  assert.doesNotMatch(entries, /(?:^|\/)data\/|\.env|\.git\/|playwright|commercial\/|third_party\/|Cargo\.toml/u);
  const { createWebsiteApp } = await import(pathToFileURL(resolve(stage, "src/app.mjs")));
  const app = createWebsiteApp({ publicDir: resolve(stage, "public") });
  t.after(() => app.close());
  app.server.listen(0, "127.0.0.1");
  await once(app.server, "listening");
  const base = `http://127.0.0.1:${app.server.address().port}`;
  assert.deepEqual(await fetch(`${base}/site-version.json`).then((r) => r.json()), {
    name: "docviewkit-website", version: result.version, revision, viewerVersion: sdk.version,
  });
  assert.equal((await fetch(`${base}/docs.json`).then((r) => r.json())).version, sdk.version);
  for (const path of ["/en/", "/zh-cn/", "/en/demo/", "/zh-cn/demo/", `/sdk/v${sdk.version}/worker.js`, `/sdk/v${sdk.version}/office-viewer-ofd.wasm`]) {
    assert.equal((await fetch(`${base}${path}`)).status, 200, path);
  }
  await assert.rejects(prepareRelease({ revision: "../main", output }), /full commit SHA/);
});

test("website publication rejects altered fonts, budgets, inventories and licenses", async (t) => {
  const stage = await mkdtemp(resolve(tmpdir(), "docviewkit-website-fonts-"));
  t.after(() => rm(stage, { recursive: true, force: true }));
  await cp(runtime, stage, { recursive: true });
  await validateBundledFonts(stage);
  const face = resolve(stage, "Caladea-Regular.ttf");
  const original = await readFile(face);
  const altered = Buffer.from(original);
  altered[altered.length - 1] ^= 1;
  await writeFile(face, altered);
  await assert.rejects(validateBundledFonts(stage), /Font hash differs/);
  await writeFile(face, Buffer.alloc(64 * 1024 + 1));
  await assert.rejects(validateBundledFonts(stage), /size budget/);
  await writeFile(face, original);
  const extra = resolve(stage, "Unreviewed.woff2");
  await writeFile(extra, "unreviewed");
  await assert.rejects(validateBundledFonts(stage), /font inventory/);
  await rm(extra);
  const license = resolve(stage, "third-party-licenses/Carlito-1.103-LICENSE.txt");
  const text = await readFile(license);
  await rm(license);
  await assert.rejects(validateBundledFonts(stage), { code: "ENOENT" });
  await writeFile(license, "OFL-1.1");
  await assert.rejects(validateBundledFonts(stage), /Font license differs/);
  await writeFile(license, text);
  const notices = resolve(stage, "THIRD_PARTY_NOTICES.md");
  const attribution = await readFile(notices, "utf8");
  await writeFile(notices, attribution.replace(/^.*\| Carlito \|.*\n/mu, ""));
  await assert.rejects(validateBundledFonts(stage), /attribution is missing/);
  await writeFile(notices, attribution);
  await validateBundledFonts(stage);
});
