# Git hooks (version-controlled)

This repo uses `core.hooksPath = .githooks` so the hooks below are shared by
every clone, not just the local `.git/hooks/` directory.

## Setup (after a fresh clone)

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## Hooks

### `pre-commit`

Runs `npm run verify` which executes `src/scene/layout.ts::verifyLayout()`.
Blocks the commit if any road / overlap / reserved violations are found.

Bypass (only if absolutely needed): `git commit --no-verify`.
