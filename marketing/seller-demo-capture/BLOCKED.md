# Capture Failed

Capture failed: All providers failed for chrome-headless-shell 131.0.6778.85:
  - DefaultProvider: Download failed: server returned code 403. URL: https://storage.googleapis.com/chrome-for-testing-public/131.0.6778.85/linux64/chrome-headless-shell-linux64.zip

URL: https://cashbak.cl

## What to try

- Re-run with a longer timeout: `--timeout 60000`
- The site may block headless browsers (anti-bot protection)
- Try capturing a different page on the same domain
