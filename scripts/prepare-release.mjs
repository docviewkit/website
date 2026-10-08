import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runtime = resolve(root, "node_modules/@docviewkit/viewer");
const fontHashes = {
  "Carlito-Bold.ttf": "0f62ab34ad5d079a0a28fac01bcf7c7a724a4db4d6cb99cab9cabff382fbb80f",
  "Carlito-BoldItalic.ttf": "380764b6898d7b73ceae6384b2958b196d2a0428962ef3adf138d27947228666",
  "Carlito-Italic.ttf": "718a0663864d37a4868220a19b9668a5fe10a46197f6df367b4c2c30c04c026c",
  "Carlito-Regular.ttf": "b4ff23ba370cc95a3c349336b73f9c28514a1371210f89832efc85c4b1ea7131",
  "Caladea-Bold.ttf": "74eda4fc5ffba0d8dc4aa76d41499f5ab76168d9ed6141c6417064c6244db9b6",
  "Caladea-BoldItalic.ttf": "f47a35ad6cd0efa9914d93f9d03c93e30c55da43674bccfabac73b3c0d522c01",
  "Caladea-Italic.ttf": "9c968bf60ba1e851cdfea77c71e3540c57792f77482dd241acc29d1425569c4e",
  "Caladea-Regular.ttf": "d2f6cad33f191e65b68bd74e6d4f7708080a41b32db635866109df3090265d91",
};

export async function validateBundledFonts(directory) {
  const fonts = (await readdir(directory, { recursive: true })).filter((name) => /\.(?:ttf|otf|ttc|woff2?)$/iu.test(name)).sort();
  if (JSON.stringify(fonts) !== JSON.stringify(Object.keys(fontHashes).sort())) throw new Error("Unapproved bundled font inventory");
  let total = 0;
  for (const name of fonts) {
    const bytes = await readFile(resolve(directory, name));
    total += bytes.length;
    if (bytes.length > (name.startsWith("Carlito") ? 832 : 64) * 1024) throw new Error(`Font size budget exceeded: ${name}`);
    if (createHash("sha256").update(bytes).digest("hex") !== fontHashes[name]) throw new Error(`Font hash differs from reviewed upstream: ${name}`);
  }
  if (total > 3 * 1024 * 1024) throw new Error("Bundled fonts exceed 3 MiB");
  const notices = await readFile(resolve(directory, "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const [family, version, license, hash] of [
    ["Carlito", "1.103", "OFL-1.1", "bbcf8ce9c8acc91355ab5d263ec9e37d498de2222336e7d42e589f791afe56c4"],
    ["Caladea", "1.002", "Apache-2.0", "6f1041c12f758ed86d804acbcb54ad822d053fa15520184c28c3b8eabb8f66f6"],
  ]) {
    const path = `third-party-licenses/${family}-${version}-LICENSE.txt`;
    if (createHash("sha256").update(await readFile(resolve(directory, path))).digest("hex") !== hash) throw new Error(`Font license differs: ${family}`);
    if (!notices.includes(`| ${family} | ${version} | ${license} | ${path} |`)) throw new Error(`Font attribution is missing: ${family}`);
  }
}

export async function prepareRelease({ revision, output = resolve(root, "release-output") }) {
  if (!/^[0-9a-f]{40}$/u.test(revision)) throw new Error("Website revision must be a full commit SHA");
  if (resolve(output) === root || root.startsWith(`${resolve(output)}/`)) throw new Error("Release output cannot contain source");
  const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const sdk = JSON.parse(await readFile(resolve(runtime, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));
  if (sdk.name !== "@docviewkit/viewer" || sdk.license !== "Apache-2.0" || sdk.version !== manifest.dependencies[sdk.name]
    || sdk.version !== lock.packages["node_modules/@docviewkit/viewer"].version) throw new Error("Viewer must match the exact locked dependency");
  await validateBundledFonts(runtime);
  await rm(output, { recursive: true, force: true });
  const stage = resolve(output, "website");
  await mkdir(stage, { recursive: true });
  for (const entry of ["src", "content", "public", "package.json", "package-lock.json", "README.md", "LICENSE", "NOTICE"]) {
    await cp(resolve(root, entry), resolve(stage, entry), { recursive: true });
  }
  await cp(runtime, resolve(stage, "node_modules/@docviewkit/viewer"), { recursive: true });
  const metadata = { name: manifest.name, version: manifest.version, revision, viewerVersion: sdk.version };
  await writeFile(resolve(stage, "public/site-version.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  const archive = `docviewkit-website-${revision}.tar.gz`;
  execFileSync("tar", ["-czf", resolve(output, archive), "-C", stage, "."]);
  const digest = createHash("sha256").update(await readFile(resolve(output, archive))).digest("hex");
  await writeFile(resolve(output, "SHA256SUMS"), `${digest}  ${archive}\n`);
  return { ...metadata, archive };
}

if (process.argv[1] === import.meta.filename) {
  const index = process.argv.indexOf("--revision");
  const revision = index === -1 ? process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim() : process.argv[index + 1];
  console.log(JSON.stringify(await prepareRelease({ revision })));
}
