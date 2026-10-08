#!/usr/bin/env bash
set -euo pipefail

revision=${1:?website commit SHA is required}
archive_name=${2:?archive name is required}
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || exit 1
[[ "$archive_name" == "docviewkit-website-$revision.tar.gz" ]] || exit 1
deploy_root=${DOCVIEWKIT_DEPLOY_ROOT:-"$HOME/apps/docviewkit"}
case "$deploy_root" in
  "$HOME"/*) ;;
  *) echo "Deploy root must be inside the account home directory" >&2; exit 1 ;;
esac
archive="$deploy_root/uploads/$archive_name"
release="$deploy_root/releases/website-$revision"
staging="$deploy_root/releases/.website-$revision-staging-$$"
test -f "$archive"
mkdir -p "$deploy_root/releases" "$deploy_root/tmp"
cleanup() { rm -rf "$staging"; }
trap cleanup EXIT
if [[ ! -d "$release" ]]; then
  mkdir "$staging"
  tar -xzf "$archive" -C "$staging"
  test -f "$staging/src/server.mjs"
  test -f "$staging/package.json"
  test -f "$staging/node_modules/@docviewkit/viewer/version.json"
  actual_revision=$(sed -n 's/.*"revision"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$staging/public/site-version.json")
  [[ "$actual_revision" == "$revision" ]] || exit 1
  mv "$staging" "$release"
fi
actual_revision=$(sed -n 's/.*"revision"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$release/public/site-version.json")
[[ "$actual_revision" == "$revision" ]] || exit 1
if [[ -e "$deploy_root/current" && ! -L "$deploy_root/current" ]]; then
  echo "Current release path must be a symlink" >&2
  exit 1
fi
printf '%s\n' 'import("./current/src/server.mjs");' > "$deploy_root/server.js.next"
mv -f "$deploy_root/server.js.next" "$deploy_root/server.js"
ln -sfn "releases/website-$revision" "$deploy_root/current"
touch "$deploy_root/tmp/restart.txt"
rm -f "$archive"
printf 'Deployed DocViewKit website %s\n' "$revision"
