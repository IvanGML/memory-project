#!/usr/bin/env bash
#
# protect-paths.sh — PreToolUse hook (Edit/Write/MultiEdit/NotebookEdit AND Bash).
#
# Blocks (exit 2 + reason on stderr) two classes of action:
#
#   1. PATH GUARD (file-editing tools): writes to local secrets (.env.local,
#      .env.*.local), key material (*.pem, *.key, id_rsa*, credentials*),
#      package-lock.json, anything under secrets/, and .github/workflows/.
#   2. COMMAND GUARD (Bash): referencing a secret file through the shell,
#      recursive-force rm in any spelling, find -delete / -exec rm, force-push,
#      git reset --hard / clean -f, pipe-to-shell installs, plus writing to a
#      protected destination via cp/mv/tee or a shell redirect.
#
#   With CLAUDE_VERIFY_LOCK=1 (autonomous runs) it also locks the files that
#   judge the agent — eslint/tsconfig/commitlint/package.json/.husky, the hooks
#   themselves and .claude/settings.json — against Edit/Write, sed/awk/perl -i
#   and cp/mv/tee. Off by default so interactive tuning is never blocked.
#
# Exit 2 wins even when permissions.allow matches, so safe commands stay
# allow-listed for UX while this hook owns the dangerous cases. Patterns match
# TEXT, not semantics: a heredoc containing "rm -rf" is blocked too — write
# such text to a file instead of inlining it.
#
# Windows: Claude Code passes paths as D:\proj\file. Every path is normalised
# to forward slashes before matching, and matching is case-insensitive (NTFS).
# Adapted from the Cactus Blueprint Harness protect-paths.sh.

set -uo pipefail

payload="$(cat)"

# --- one parser call: tool \x1f file \x1f command (jq -> node -> python3) ---
parse() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r '[(.tool_name // ""), (.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // ""), (.tool_input.command // "")] | join("\u001f")' 2>/dev/null
  elif command -v node >/dev/null 2>&1; then
    printf '%s' "$payload" | node -e '
let d = {};
try { d = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch (e) { process.exit(1); }
const t = d.tool_input || {};
process.stdout.write([d.tool_name || "", t.file_path || t.notebook_path || t.path || "", t.command || ""].join("\x1f"));' 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$payload" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(1)
t = d.get("tool_input") or {}
sys.stdout.write("\x1f".join([d.get("tool_name") or "", t.get("file_path") or t.get("notebook_path") or t.get("path") or "", t.get("command") or ""]))' 2>/dev/null
  else
    return 1
  fi
}

tool=""; file=""; cmd=""
parsed="$(parse)" || parsed=""
# Process substitution, not a here-string: <<< appends a newline that would land
# in the last field and make an Edit payload look like a Bash command.
IFS=$'\x1f' read -r -d '' tool file cmd < <(printf '%s' "$parsed") || true

# Fallback: nothing parsed. Scan the raw payload and fail TOWARD blocking.
if [ -z "${tool}${file}${cmd}" ]; then
  raw="${payload//\\//}"
  if printf '%s' "$raw" | grep -Eiq 'rm[[:space:]]+-[a-z]*r[a-z]*f|rm[[:space:]]+-[a-z]*f[a-z]*r|find[[:space:]].*-delete|git[[:space:]]+push[^"]*(--force|[[:space:]]-f|[[:space:]]\+)|reset[[:space:]]+--hard|clean[[:space:]]+-[a-z]*f|(curl|wget)[^"]*\|[[:space:]]*(sh|bash|zsh)|\.env\.local|\.env\.[a-z]+\.local|\.pem|\.key|secrets/|id_rsa|credentials|package-lock\.json'; then
    echo "BLOCKED: could not parse the tool payload (no jq/node/python3) and it matched a dangerous pattern." >&2
    echo "Install node or python3 so the guard can inspect commands precisely, or run this by hand after review." >&2
    exit 2
  fi
  exit 0
fi

# Normalise Windows paths once; every check below uses the normalised forms.
file="${file//\\//}"
cmd_n="${cmd//\\//}"
shopt -s nocasematch

block() { # $1 = path-or-command, $2 = reason
  echo "BLOCKED: $1 — $2." >&2
  echo "Do not bypass this guard. Secrets: never print them. Lockfiles: regenerate via npm. CI: change via a reviewed PR. Destructive ops: a human runs them after review." >&2
  exit 2
}

# Basename globs that Claude must never modify (path guard + cp/mv/tee dest).
PROTECTED=(
  ".env.local" ".env.*.local"
  "*.pem" "*.key" "id_rsa*" "credentials*" "*.p12" "*.keystore"
  "package-lock.json"
)

# The gate that judges the agent. Locked only under CLAUDE_VERIFY_LOCK=1.
VERIFY_LOCKED=(
  "eslint.config.js" "tsconfig.json" "tsconfig.app.json" "tsconfig.node.json"
  "commitlint.config.js" "package.json"
  ".husky/*" "*/.husky/*"
  ".claude/hooks/*" "*/.claude/hooks/*"
  ".claude/settings.json" "*/.claude/settings.json"
  "*.test.*" "*.spec.*" "tests/*" "*/tests/*" "*/__tests__/*"
)

lock_on() { [ "${CLAUDE_VERIFY_LOCK:-0}" = "1" ]; }

matches_any() { # $1 = path, rest = globs; matches full path or basename
  local p="$1" b pat; shift
  b="$(basename "$p")"
  for pat in "$@"; do
    # shellcheck disable=SC2053
    [[ "$p" == $pat || "$b" == $pat ]] && return 0
  done
  return 1
}

is_protected_path() { # $1 = normalised path
  local p="$1"
  matches_any "$p" "${PROTECTED[@]}" && return 0
  [[ "$p" == secrets/* || "$p" == */secrets/* ]] && return 0
  [[ "$p" == .github/workflows/* || "$p" == */.github/workflows/* ]] && return 0
  return 1
}

check_dest() { # echo the effective destination path of a cp/mv/tee/sed command
  # Default: the last non-flag argument. GNU cp/mv also accept the
  # target-directory-first form (`cp -t DIR src`, `cp -rt DIR src`,
  # `cp --target-directory=DIR src`); there the last argument is a SOURCE, so
  # the effective destination is DIR/basename(last source).
  local last="" tdir="" want_dir=0 a
  for a in "$@"; do
    a="${a#\"}"; a="${a%\"}"; a="${a#\'}"; a="${a%\'}"
    [ -z "$a" ] && continue
    if [ "$want_dir" = 1 ]; then tdir="$a"; want_dir=0; continue; fi
    case "$a" in
      --target-directory=*) tdir="${a#--target-directory=}" ;;
      --target-directory)   want_dir=1 ;;
      -t|-[a-zA-Z]*t)       want_dir=1 ;;   # -t or a flag cluster ending in t (-rt)
      -*)                   ;;
      *)                    last="$a" ;;
    esac
  done
  if [ -n "$tdir" ]; then
    if [ -n "$last" ]; then printf '%s/%s' "${tdir%/}" "$(basename "$last")"; else printf '%s/' "${tdir%/}"; fi
  else
    printf '%s' "$last"
  fi
}

# Character classes used in the shell regexes below.
Q='"'"'"           # a double or single quote
NSQ='[^[:space:]"'"'"']'   # one char that is neither whitespace nor a quote

# ===========================================================================
# COMMAND GUARD (Bash)
# ===========================================================================
if [ -n "$cmd_n" ]; then
  # 1) Any static reference to a local secret file through the shell.
  secret_tgt="(\.env\.local|\.env\.[a-z]+\.local|${NSQ}+\.(pem|key)([^[:alnum:]_-]|\$)|id_rsa|credentials|(^|[[:space:]=/${Q}])secrets/)"
  if printf '%s' "$cmd_n" | grep -Eiq "$secret_tgt"; then
    block "$cmd" "references a secret file through the shell (.env.local / *.pem / *.key / secrets/)"
  fi

  # 2) Recursive-force rm in ANY flag spelling/order.
  if printf '%s' "$cmd_n" | grep -Eiq '(^|[^[:alnum:]_])rm([[:space:]]|$)'; then
    if printf '%s' "$cmd_n" | grep -Eiq '(^|[[:space:]])(-[a-zA-Z]*r|--recursive)' \
       && printf '%s' "$cmd_n" | grep -Eiq '(^|[[:space:]])(-[a-zA-Z]*f|--force)'; then
      block "$cmd" "recursive-force delete (rm with -r and -f, any spelling)"
    fi
  fi

  # 3) Other destructive commands. Format: '<regex>::<reason>'.
  DANGER=(
    '(^|[^[:alnum:]])find[[:space:]].*-delete::find -delete (bulk delete)'
    '(^|[^[:alnum:]])find[[:space:]].*-exec[[:space:]]+rm::find -exec rm (bulk delete)'
    '(^|[^[:alnum:]])git([[:space:]]+(-C|--git-dir|--work-tree)[[:space:]]+[^[:space:]]+)*[[:space:]]+push([[:space:]][^|;&]*)?([[:space:]](--force|--force-with-lease|--force-if-includes|-f)([[:space:]=]|$)|[[:space:]]\+[[:alnum:]])::force-push (rewrites/clobbers remote)'
    '(^|[^[:alnum:]])git([[:space:]]+(-C|--git-dir|--work-tree)[[:space:]]+[^[:space:]]+)*[[:space:]]+reset[[:space:]]+--hard::git reset --hard (discards working changes)'
    '(^|[^[:alnum:]])git([[:space:]]+(-C|--git-dir|--work-tree)[[:space:]]+[^[:space:]]+)*[[:space:]]+clean[[:space:]]+(-[a-zA-Z]*[[:space:]]*)*-[a-zA-Z]*f::git clean -f (deletes untracked files)'
    '(^|[^[:alnum:]])(curl|wget)[^|]*\|[[:space:]]*(sudo[[:space:]]+)?(sh|bash|zsh)([^[:alnum:]]|$)::pipe-to-shell install (curl | sh)'
    '(^|[^[:alnum:]])(sh|bash|zsh)[^|;&]*<[[:space:]]*(<)?[[:space:]]*\([[:space:]]*(curl|wget)([^[:alnum:]]|$)::process-substitution installer (bash <(curl ...))'
  )
  for entry in "${DANGER[@]}"; do
    re="${entry%%::*}"; reason="${entry##*::}"
    if printf '%s' "$cmd_n" | grep -Eiq "$re"; then
      block "$cmd" "$reason"
    fi
  done

  # 4) cp/mv/tee destination: per-tool deny rules only see Edit/Write paths.
  for trigger_cmd in cp mv tee; do
    if printf '%s' "$cmd_n" | grep -Eiq "(^|[^[:alnum:]_])$trigger_cmd([[:space:]]|\$)"; then
      # shellcheck disable=SC2086
      dest="$(check_dest $cmd_n)"
      [ -z "$dest" ] && continue
      if is_protected_path "$dest"; then
        block "$cmd" "destination '$dest' is a protected file (secret, lockfile, secrets/ or CI config)"
      fi
      if lock_on && matches_any "$dest" "${VERIFY_LOCKED[@]}"; then
        block "$cmd" "destination '$dest' is verification code locked during an autonomous run (CLAUDE_VERIFY_LOCK=1)"
      fi
    fi
  done

  # 4b) Shell redirects can write protected files without cp/mv/tee.
  redirect_re=">{1,2}[[:space:]]*[${Q}]?(${NSQ}*/)?(\.github/workflows/${NSQ}+|package-lock\.json|\.env\.local|\.env\.[a-z]+\.local|${NSQ}+\.(pem|key))([^[:alnum:]_-]|\$)"
  if printf '%s' "$cmd_n" | grep -Eiq "$redirect_re"; then
    block "$cmd" "redirects output to a protected file"
  fi

  # 5) VERIFY_LOCK for the shell: in-place rewrites of locked files.
  if lock_on && printf '%s' "$cmd_n" | grep -Eq '(^|[^[:alnum:]_])(sed|awk|perl)([[:space:]][^|;&]*)?[[:space:]](-[a-zA-Z]*i|--in-?place)'; then
    # shellcheck disable=SC2086
    tgt="$(check_dest $cmd_n)"
    if [ -n "$tgt" ] && matches_any "$tgt" "${VERIFY_LOCKED[@]}"; then
      block "$cmd" "rewrites verification code in place while it is locked (CLAUDE_VERIFY_LOCK=1) — change the implementation, not the gate"
    fi
  fi

  exit 0
fi

# ===========================================================================
# PATH GUARD (Edit/Write/MultiEdit/NotebookEdit)
# ===========================================================================
[ -z "$file" ] && exit 0

if lock_on && matches_any "$file" "${VERIFY_LOCKED[@]}"; then
  echo "BLOCKED: '$file' is verification code and is locked during an autonomous run (CLAUDE_VERIFY_LOCK=1)." >&2
  echo "The agent may not modify the gate that verifies it. Change the implementation, not eslint/tsconfig/hooks/tests." >&2
  exit 2
fi

if is_protected_path "$file"; then
  block "$file" "protected file (secret, lockfile, secrets/ directory or CI config)"
fi

exit 0
