# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **Google Apps Script** project managed with [`clasp`](https://github.com/google/clasp).

### Toolchain

- Node.js 20+ (nvm) and npm
- Local + global `@google/clasp` 3.x (prefer `npx clasp` / `npm run …`)
- Apps Script sources are plain `.js` under `src/` (clasp 3 no longer transpiles TypeScript)
- Optional editor/typecheck via `jsconfig.json` + `@types/google-apps-script` (`npm run typecheck`)
- `src/` is the clasp `rootDir`

Cloud boot runs `bash scripts/cloud-install.sh` (see `.cursor/environment.json`).

### Auth (required for push/pull/deploy)

Interactive `clasp login` does not work well on headless cloud VMs.

1. On a local machine: `npx clasp login`, then copy `~/.clasprc.json`
2. In Cursor Dashboard → Cloud Agents → Secrets for this environment, add a **Runtime Secret**:
   - Name: `CLASPRC_JSON`
   - Value: full JSON contents of `.clasprc.json`
3. `scripts/cloud-install.sh` writes it to `~/.clasprc.json` on boot

Never commit `.clasprc.json`.

### Project binding

`.clasp.json` currently has a placeholder `scriptId`. Before `clasp push` / `clasp pull`:

1. Create or open the Apps Script project in Google
2. Set `scriptId` in `.clasp.json` to that project id
3. Prefer a staging script for agent experiments

### Common commands

```bash
export PATH="$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" | sort -V | tail -1)/bin:$PATH"
npm run typecheck
npm run status          # files clasp would push
npm run auth-status     # confirms CLASPRC_JSON worked
npm run push            # upload src/ to Apps Script
npm run pull            # download from Apps Script
```

### Sibling repo

`teamcity-ci-cd-settings` is attached as a repository dependency for future CI wiring. It is not required for local clasp edit/push loops.
