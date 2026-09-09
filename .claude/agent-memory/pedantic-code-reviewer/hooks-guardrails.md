---
name: hooks-guardrails
description: Known bypass gaps in .claude/hooks/protect-paths.sh (bash text-matching guard) worth re-checking whenever the hook is edited
metadata:
  type: project
---

Verified 2026-09-09 against the staged "adopt harness guardrails" change (commit context: `.claude/hooks/protect-paths.sh`, `.claude/hooks/gate.sh`, `.claude/settings.json`). Re-test these whenever the hook's DANGER regexes or `check_dest` change — `bash .claude/hooks/test-hooks.sh` does NOT cover either gap below as of that commit.

**1. `cp -t DIR/ file` / `mv -t DIR/ file` (GNU target-directory flag) defeats `check_dest`.**
`check_dest()` assumes the *last* non-flag argument is the destination. With `-t DIR`, the destination comes *before* the sources, so the last non-flag arg is actually a *source* file. Result: `cp -t .github/workflows/ /tmp/malicious.yml` is **allowed** (exit 0) even though the equivalent `cp /tmp/malicious.yml .github/workflows/malicious.yml` is correctly blocked. This defeats the always-on `PROTECTED` set (`.github/workflows/`, `package-lock.json`, secrets by basename) with no env var required — and also defeats `VERIFY_LOCKED` directory-glob entries (`.claude/hooks/*`, `.husky/*`) under `CLAUDE_VERIFY_LOCK=1`. Basename-only protected patterns (`*.pem`, `package-lock.json`) are *not* bypassed this way because cp/mv `-t` preserves the source's basename as the destination's basename, so check_dest's basename check still coincidentally fires — only directory-prefix protections are exploitable.
Fix direction: detect `-t`/`--target-directory=` and compute dest as `DIR/basename(last source)` instead of the raw last arg.

**2. `git push --force-with-lease=<refname>:<expect>` (the `=value` form, no space) bypasses the force-push DANGER regex.**
The regex requires a whitespace or end-of-string boundary immediately after `--force`/`--force-with-lease`/`-f`. Real git syntax allows `--force-with-lease=origin/main:abc123` with no space, so the boundary never matches. This is a fully standard, non-obfuscated git invocation, not a text-matching edge case. Confirmed the `settings.json` deny rule (`Bash(git push --force *)`) has the same flaw (requires literal space before `*`, matches only `--force ` prefix) so this is not just a hook-only gap.
Fix direction: change boundary to `([[:space:]=]|$)` so `=` also terminates the flag token.

Both were verified live against this repo's `protect-paths.sh` by piping synthetic Bash tool_input JSON through the script and checking exit code — this is the fast way to re-verify: no test framework needed, just `bash .claude/hooks/protect-paths.sh <<< '<json>'`.
