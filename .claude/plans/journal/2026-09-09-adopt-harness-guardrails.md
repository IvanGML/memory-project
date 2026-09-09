# Adopt harness guardrails — hooks, permissions, intake skill

**Date:** 2026-09-09
**Plan:** plan-adopt-harness-guardrails
**Commits:** uncommitted at time of writing
**Status:** Done

## Why
A temporary local copy of the Cactus Blueprint Harness (never tracked, deleted after this plan) was analysed to see what a solo Windows developer could borrow. Before this plan the project had no deterministic safety boundary: global `defaultMode: auto`, no `.claude/settings.json`, no hooks, and verification happened only when someone remembered `/finalize`. Working Rule 1 demanded clarification but gave no method for it. Sessions that stopped mid-plan left the next one to reconstruct state from `git diff`.

## What we built
- **`.claude/settings.json`** (committed): allow / ask / deny permissions tuned to this npm repo, plus hook wiring in *shell form* (`bash "${CLAUDE_PROJECT_DIR}/..."`).
- **`.claude/hooks/protect-paths.sh`** — PreToolUse on edits and Bash. Blocks writes/reads of `.env.local`, key material, `secrets/`, `package-lock.json`, `.github/workflows/`, and destructive shell (`rm -rf` any spelling, `find -delete`, force-push incl. `--force-with-lease=`, `reset --hard`, `clean -f`, `curl | sh`, cp/mv/tee/redirect into protected paths, `cp -t DIR` form). `CLAUDE_VERIFY_LOCK=1` additionally locks eslint/tsconfig/commitlint/package.json/.husky/hooks/settings/tests.
- **`.claude/hooks/gate.sh`** — Stop hook: when `.ts/.tsx/.js`, `tsconfig*` or `package*.json` changed, runs `npm run lint` + `npx tsc -b` (~4 s), blocks on red for up to 3 attempts per chain, then releases with a warning.
- **`.claude/hooks/test-hooks.sh`** — 66 behavioural cases with Windows-style paths; all green.
- **Skills** `intake-grill` (+ `completion.md`), `write-a-skill`, `tdd` (+ 5 reference files), stripped of `.harness/`, OpenCode and Jira references.
- **Templates/docs:** `SESSION-HANDOFF-TEMPLATE.md`; `TEMPLATE.md` gained `### Prevention` and *Explicitly not needed now*; `/journal` reads a session handoff and collects prevention items; CLAUDE.md gained a Guardrails section, Working Rule 1 method, Working Rule 3 note, skill rows.
- **Repo hygiene:** `.gitattributes` forces LF on hooks (autocrlf=true here); hooks are `100755` in the index; `.claude/settings.local.json` untracked and gitignored.

## Architecture impact
New layer: `.claude/hooks/` (bash, Git Bash required). New committed `.claude/settings.json`. New convention: `CLAUDE_VERIFY_LOCK` / `CLAUDE_GATE*` env knobs. CLAUDE.md sections added or changed in the same commit: Commands (eslint ignore note), Guardrails (new), Environment Configuration (`.env.local` protection), Development Journal (session handoff, Prevention), Project Skills (3 rows), Working Rules 1 and 3.

## Tradeoffs
- **Project-local, not global** — user's choice: prove it in one repo first.
- **Hooks in bash, not PowerShell** — Git Bash is present and the harness scripts port with a slash-normalisation fix; a PowerShell port is YAGNI. Wired in shell form because `bash` on the Windows PATH is WSL.
- **No `format.sh`** — no prettier; lint-staged already runs `eslint --fix` at commit; a PostToolUse eslint would cost ~2 s per edit for nothing new.
- **No `mission-state-guard` / `grill-guard`** — native plan mode already gates implementation and cannot be reasoned around.
- **Stop gate skips on a clean tree and on non-code changes** — plan mode and doc turns must stay free; a red `tsc` committed without `/finalize` can slip past. Accepted for a solo repo.
- **`.env` left editable** — CLAUDE.md defines it as committed Vite defaults; only `.env.local` / `.env.*.local` are protected.
- **Hook/settings self-protection only under lock** — interactive tuning (including this plan) must stay possible; the diff reveals changes.
- **Reviewer `permissionMode: readOnly` not adopted** — it would break the agent's project memory writes.

**Explicitly not needed now:** the harness's triple skill mirror, `mission.md`/`validation.md` state files, `lessons.md`, Jira/Confluence/GitLab packs, installer, `check-reconstruction.sh`, PRD→DAG decomposition, a global `~/.claude` rollout.

## Known limitations / follow-ups
- Live hook execution through Claude Code on this machine was verified only via `test-hooks.sh` and a manual `gate.sh` run; hooks load at session start, so the first real confirmation is the next session (`cat .env.local` should be blocked, `git push` should prompt).
- Hooks match command text, not semantics: `credentials`, `secrets/`, `rm -rf` inside a heredoc or commit message are blocked. Write such text to a file.
- `--force-with-lease=` is caught by the hook and by the `Bash(git push --force*)` deny rule; `git push origin +main` only by the hook.
- Reviewer Minor items deferred to the user: reset counter on any non-`true` `stop_hook_active`; `set -f` around `check_dest` to avoid glob expansion; shared fallback counter when `session_id` is absent.
- The harness source copy is not part of the repo; nothing in the flow references it. The full analysis lives in `plan-adopt-harness-guardrails.md` (Приложение).

### Prevention
- `grep -c $'\r'` under Git Bash reported every line as CRLF on LF-only files (false alarm that cost a debugging round) → detect CRLF with `tr -cd '\r' | wc -c`.
- Bash-tool heredocs with many quotes failed to parse → write scripts with the Write tool, then `sed -i 's/\r$//'` if needed.
- `read -d ''` with a here-string appended `\n` to the last field → use `< <(printf '%s' …)`.
- `git status --porcelain` collapsed a new dir to `?? src/` → always `--untracked-files=all`.
- Glob `-[a-zA-Z]*t` did not match bare `-t` → list the short form explicitly (`-t|-[a-zA-Z]*t`).
- ESLint ignored `.gitignore` and scanned a scratch folder full of `.ts` (55 s, red) → add any vendored/scratch folder to `globalIgnores` or keep it outside the repo.
- Reviewer found `cp -t DIR` and `--force-with-lease=` bypasses the tests missed → every new guard pattern needs an adversarial spelling in `test-hooks.sh`.
