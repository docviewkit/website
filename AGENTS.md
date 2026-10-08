# Website rules

- This repository owns docviewkit.com. Viewer and Engine source and npm publication belong to docviewkit/viewer.
- Use an exact, locked @docviewkit/viewer npm version. Serve its complete runtime, fonts and licenses through /sdk/; do not rebuild or copy core source.
- Website and Viewer versions are independent. Documentation and Demo must report the installed Viewer version.
- Keep document processing local to the browser. Preserve CSP, asset restrictions, and the absence of account/registration APIs.
- Deploy only tested commits. Preserve old releases and archived customer data. Never commit secrets or data.
- Changes require a real failing-before/passing-after case. Validate Demo loading in Chromium, Firefox and WebKit.
- Approved fonts remain Carlito 1.103 and Caladea 1.002, four faces each, total at most 3 MiB. Keep reviewed hashes, size limits, licenses and attribution in the release gate.
