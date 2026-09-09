#!/usr/bin/env bash
#
# gate.sh — Stop hook. Runs the cheap verification gates (lint + typecheck)
# when Claude tries to end its turn with code changes in the working tree.
# RED blocks the stop (exit 2) and feeds the failures back so Claude keeps
# fixing; bounded to CLAUDE_GATE_MAX attempts per chain, then releases with a
# warning. It is a safety net under /finalize, not a replacement for it.
#
# Skips (exit 0):
#   - CLAUDE_GATE=0
#   - clean working tree
#   - only non-code files changed (.md, .scss, .sh, assets, ...)
#   - infrastructure failure (cannot cd / git unavailable) — fail OPEN: a Stop
#     hook that traps the user on a broken environment is worse than a missed
#     lint run.
#
# Knobs: CLAUDE_GATE (1), CLAUDE_GATE_MAX (3), CLAUDE_GATE_CMD (test override
# replacing the gate list with one command).
# Adapted from the Cactus Blueprint Harness verify-gate.sh.

set -uo pipefail

[ "${CLAUDE_GATE:-1}" = "0" ] && exit 0

payload="$(cat)"

# --- one parser call: session_id \x1f stop_hook_active (jq -> node -> python3)
parse() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r '[(.session_id // ""), (if .stop_hook_active == true then "true" elif .stop_hook_active == false then "false" else "" end)] | join("\u001f")' 2>/dev/null
  elif command -v node >/dev/null 2>&1; then
    printf '%s' "$payload" | node -e '
let d = {};
try { d = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch (e) { process.exit(1); }
const a = d.stop_hook_active === true ? "true" : d.stop_hook_active === false ? "false" : "";
process.stdout.write([d.session_id || "", a].join("\u001f"));' 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$payload" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(1)
a = d.get("stop_hook_active")
sys.stdout.write("\x1f".join([d.get("session_id") or "", "true" if a is True else ("false" if a is False else "")]))' 2>/dev/null
  else
    return 1
  fi
}

sid=""; stop_active=""
parsed="$(parse)" || parsed=""
IFS=$'\x1f' read -r -d '' sid stop_active < <(printf '%s' "$parsed") || true

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" 2>/dev/null || { echo "gate: cannot cd to $ROOT — skipping gate." >&2; exit 0; }

# --untracked-files=all: without it a new directory collapses to "?? src/" and
# the code filter below would never see the .ts files inside it.
changed="$(git status --porcelain --untracked-files=all 2>/dev/null)" || { echo "gate: git status failed — skipping gate." >&2; exit 0; }
[ -z "$changed" ] && exit 0

# Only gate when files that lint/tsc actually evaluate have changed.
code_re='\.(ts|tsx|js|mjs|cjs)$|(^|/)tsconfig[^/]*\.json$|(^|/)package(-lock)?\.json$'
printf '%s\n' "$changed" | cut -c4- | sed 's/ -> /\n/' | tr -d '"' | grep -Eq "$code_re" || exit 0

# --- gates --------------------------------------------------------------------
if [ -n "${CLAUDE_GATE_CMD:-}" ]; then
  GATES=("custom::${CLAUDE_GATE_CMD}")
else
  GATES=("lint::npm run lint" "typecheck::npx tsc -b")
fi

failed=""; out=""
for g in "${GATES[@]}"; do
  name="${g%%::*}"; run="${g#*::}"
  out="$(bash -c "$run" 2>&1)"; rc=$?
  if [ $rc -ne 0 ]; then failed="$name"; break; fi
done

# --- retry counter (per session, per-user state dir, atomic write) ------------
MAX="${CLAUDE_GATE_MAX:-3}"
[ -z "$sid" ] && sid="default-$(printf '%s' "$ROOT" | cksum | cut -d' ' -f1)"
STATE_DIR="${XDG_RUNTIME_DIR:-${HOME:-/tmp}/.cache}/claude-hooks"
mkdir -p "$STATE_DIR" 2>/dev/null
ctr="$STATE_DIR/gate.${sid}"

if [ -z "$failed" ]; then rm -f "$ctr"; exit 0; fi   # green -> allow, reset budget

n=0; [ -f "$ctr" ] && n="$(cat "$ctr" 2>/dev/null || echo 0)"
[[ "$n" =~ ^[0-9]+$ ]] || n=0
# An explicit stop_hook_active=false means a fresh chain (the user sent a new
# message); an absent field keeps the stored count so the loop stays bounded.
[ "$stop_active" = "false" ] && n=0

if [ "$n" -ge "$MAX" ]; then
  rm -f "$ctr"
  echo "Gate still RED after ${n} attempt(s) — allowing stop. ${failed} is failing and must be fixed before this is committed (run /finalize)." >&2
  exit 0
fi

if tmpctr="$(mktemp "${ctr}.XXXXXX" 2>/dev/null)"; then
  echo $((n + 1)) > "$tmpctr" && mv -f "$tmpctr" "$ctr"
fi
echo "GATE FAILED (${failed}). Do not finish yet: fix the implementation — do not edit eslint.config.js, tsconfig*.json, package.json or .claude/hooks to make it pass. Attempt $((n + 1)) of ${MAX}." >&2
echo "----- ${failed} output (tail) -----" >&2
printf '%s\n' "$out" | tail -n 30 >&2
exit 2
