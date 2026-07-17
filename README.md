# canaan-worship-flow-printer

Google Apps Script project for Canaan worship flow printing, developed with [clasp](https://github.com/google/clasp).

## Prerequisites

- Node.js 20+
- A Google account with access to the target Apps Script project
- clasp credentials (`clasp login`, or `CLASPRC_JSON` in Cursor Cloud)

## Setup

```bash
npm install
npx clasp login
```

Set the real Apps Script id in `.clasp.json` (`scriptId`), then:

```bash
npm run typecheck
npm run status
npm run push
```

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | Apps Script sources (`rootDir`) |
| `src/appsscript.json` | Apps Script manifest |
| `.clasp.json` | clasp project binding |
| `scripts/cloud-install.sh` | Cursor Cloud install hook |
| `.cursor/environment.json` | Cloud agent environment config |

## Cursor Cloud

See [AGENTS.md](./AGENTS.md) for cloud auth (`CLASPRC_JSON`), PATH notes, and agent workflow.
