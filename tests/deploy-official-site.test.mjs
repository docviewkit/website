import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readlink, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("website deploy switches independent commits, preserves old releases and customer data", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "docviewkit-website-deploy-"));
  const source = resolve(root, "source");
  const deploy = resolve(root, "home/apps/docviewkit");
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of ["src", "public", "node_modules/@docviewkit/viewer"]) await mkdir(resolve(source, path), { recursive: true });
  await mkdir(resolve(deploy, "uploads"), { recursive: true });
  await mkdir(resolve(deploy, "data"), { recursive: true });
  await mkdir(resolve(deploy, "releases/v0.2.75"), { recursive: true });
  await writeFile(resolve(deploy, "data/persistent"), "keep");
  await writeFile(resolve(source, "src/server.mjs"), "");
  await writeFile(resolve(source, "package.json"), '{"type":"module"}\n');
  await writeFile(resolve(source, "node_modules/@docviewkit/viewer/version.json"), '{"version":"0.2.75"}\n');
  const run = (revision) => spawnSync("bash", ["scripts/deploy-official-site.sh", revision, `docviewkit-website-${revision}.tar.gz`], {
    cwd: resolve(import.meta.dirname, ".."),
    env: { ...process.env, HOME: resolve(root, "home"), DOCVIEWKIT_DEPLOY_ROOT: deploy }, encoding: "utf8",
  });
  const archive = async (revision, actual = revision) => {
    await writeFile(resolve(source, "public/site-version.json"), `${JSON.stringify({ revision: actual })}\n`);
    assert.equal(spawnSync("tar", ["-czf", resolve(deploy, "uploads", `docviewkit-website-${revision}.tar.gz`), "-C", source, "."]).status, 0);
  };
  const first = "a".repeat(40), second = "b".repeat(40), wrong = "c".repeat(40);
  await archive(first);
  let result = run(first);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readlink(resolve(deploy, "current")), `releases/website-${first}`);
  assert.equal(await readFile(resolve(deploy, "server.js"), "utf8"), 'import("./current/src/server.mjs");\n');
  await archive(second);
  result = run(second);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readlink(resolve(deploy, "current")), `releases/website-${second}`);
  assert.equal(await readFile(resolve(deploy, "data/persistent"), "utf8"), "keep");
  await readFile(resolve(deploy, `releases/website-${first}/public/site-version.json`));
  await archive(wrong, first);
  result = run(wrong);
  assert.notEqual(result.status, 0, result.stderr + result.stdout);
  assert.equal(await readlink(resolve(deploy, "current")), `releases/website-${second}`);
  await archive(second);
  assert.equal(run(second).status, 0);
});
