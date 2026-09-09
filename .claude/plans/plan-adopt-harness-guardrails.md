# Plan — Adopt harness guardrails into memory-project

## Context

`D:\projects\memory-project\harness-blueprint-develop` — локальный source-drop проприетарного стартера «Cactus Blueprint Harness» (Cactus Soft, ~250 файлов, июнь 2026). Он уже в `.gitignore`. Анализ (три исследователя + ручная проверка хуков) показал: это не набор скиллов, а дисциплина вокруг агента (intake → mission → validation до кода → одобрение → реализация с петлёй на гейте → независимая проверка → handoff). Полная выжимка анализа — в разделе «Приложение: анализ» ниже.

Пользователь выбрал перенести **все четыре** направления, но **только в memory-project** (не в `~/.claude`):

1. Защитный контур: permissions allow/ask/deny + PreToolUse-хук `protect-paths.sh` (с фиксом обратных слэшей Windows).
2. Stop-хук «lint + tsc зелёные, иначе не завершай» — страховка поверх `/finalize`.
3. Скиллы-дженерики: `intake-grill`, `write-a-skill`, `tdd`.
4. Процессные идеи без кода: `session-handoff`, поле prevention в journal, секция «что явно не нужно».

Текущее состояние проекта: `.claude/settings.json` **отсутствует** (есть только `settings.local.json` с ad-hoc allow), хуков нет, глобальный `defaultMode: auto` без deny-списка. Окружение: Git Bash 5.2 (msys), `python3` работает, `jq` нет, **`core.autocrlf=true`**, `.gitattributes` нет, prettier нет.

Итог: у проекта появляется детерминированная защитная граница (не зависящая от промпта), автоматический гейт при завершении хода, и метод для Working Rule 1 вместо одного требования.

---

## Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| Место | `.claude/` проекта, коммитится | Выбор пользователя: обкатать в одном проекте |
| Формат хуков | bash (`.sh`), вызов как `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/x.sh"` | NTFS без exec-bit; Git Bash есть; PowerShell-порт хуков — YAGNI |
| Парсинг JSON в хуках | `jq → python3` ladder, как в harness | `jq` отсутствует, `python3` есть |
| Пути Windows | Нормализация `\` → `/` сразу после извлечения | Иначе path-guard fail open (проверено) |
| Line endings | `.gitattributes`: `*.sh text eol=lf` | `autocrlf=true` иначе сломает shebang (`^M`) |
| Гейт Stop-хука | `npm run lint` + `npx tsc -b`, без `build` | build медленный; он остаётся в `/finalize` |
| Пропуск гейта | Если `git status --porcelain` пуст | Plan mode и чистые сессии не должны блокироваться |
| `format.sh` | **Не берём** | prettier нет; lint-staged уже делает `eslint --fix` на коммите; PostToolUse `eslint --fix` = ~2 с на каждую правку ради того, что уже сделано дважды |
| `.env` | Защищаем только `.env.local`, `.env.*.local` | CLAUDE.md: `.env` — коммитируемые Vite-дефолты, Claude должен уметь добавлять туда `VITE_*` |
| Форма вызова хуков | shell-форма `bash "${CLAUDE_PROJECT_DIR}/..."` | `bash` в Windows PATH — WSL; shell-форма на Windows идёт через Git Bash |
| `mission-state-guard`, `grill-guard` | **Не берём** | Нативный plan mode делает то же |
| `pedantic-code-reviewer` `permissionMode: readOnly` | **Не трогаем** | У агента `memory: project` — readOnly сломает запись памяти агента |
| Скиллы | Копируем с адаптацией, убираем ссылки на `.harness/*`, OpenCode, Jira | Триггеры сохраняем; frontmatter приводим к формату проекта (`name`, `description`, `allowed-tools`) |
| Commit scope | `config` (хуки, settings, скиллы, шаблоны), `global` (CLAUDE.md, .gitattributes) | Существующие скоупы; новых не добавляем |
| Plan file | Копия в `.claude/plans/plan-adopt-harness-guardrails.md` | Известное ограничение `/journal` (см. CLAUDE.md) |

---

## Files to Create / Modify

### Блок A — защитный контур

**A1. `.claude/settings.json` — new** (committed). Permissions + hooks wiring.
Детали (allow/ask/deny списки, точный JSON хуков) — см. раздел «Дизайн хуков» ниже (заполняется по результату Plan-агента).

**A0. `eslint.config.js` — modify (prerequisite).** `globalIgnores(['dist', 'harness-blueprint-develop'])`. Без этого lint 55 с и красный (ESLint не читает `.gitignore`). Убрать запись, когда вендорная папка будет удалена.

**A2. `.claude/hooks/protect-paths.sh` — new.** Адаптация harness-версии; полный список решений — в разделе «Дизайн хуков». Кратко: нормализация `\`→`/`, `nocasematch`, один вызов парсера (`jq → node → python3`), `PROTECTED` сужен до реалий npm-репо (`.env.local`, `.env.*.local`, `*.pem`, `*.key`, `id_rsa*`, `credentials*`, `*.p12`, `*.keystore`, `package-lock.json`), CI только `.github/workflows/*`, curl блокируется только как pipe-to-shell, `VERIFY_LOCKED` = eslint/tsconfig/commitlint/package.json/.husky/.claude/hooks/.claude/settings.json/тест-глобы. **`.env` не защищён**: по CLAUDE.md это коммитируемые Vite-дефолты.

**A3. `.claude/hooks/test-hooks.sh` — new.** Поведенческий тест по образцу `scripts/check-enforcement-guards.sh`: синтетические JSON-payload с Windows-путями → assert exit code. Таблица кейсов — в разделе «Дизайн хуков».

**A4. `.gitattributes` — new.** `*.sh text eol=lf`, `.claude/hooks/* text eol=lf`, `.husky/* text eol=lf`. Без `* text=auto`. Плюс `git update-index --chmod=+x .claude/hooks/*.sh` (`core.filemode=false`, обычный chmod бесполезен).

**A5. `.claude/settings.local.json` — cleanup (optional).** Удалить одноразовые allow (cp из `/tmp/design_extracted`, kill, awk) — они мусор после переезда в settings.json. Пользователь решает при реализации.

### Блок B — Stop-хук

**B1. `.claude/hooks/gate.sh` — new.** Адаптация `verify-gate.sh` без `verify.sh`; детали — в «Дизайн хуков». Кратко: skip при чистом дереве или если изменены только не-код файлы; `npm run lint` → `npx tsc -b`; exit 2 + `tail -n 30` при провале; bounded retry 3 попытки со счётчиком в `$HOME/.cache/claude-hooks/`; `CLAUDE_GATE=0` выключает; только событие `Stop`.

### Блок C — скиллы

**C1. `.claude/skills/intake-grill/SKILL.md` + `completion.md` — new.** Из `harness-blueprint-develop/.claude/skills/intake-grill/`. Адаптация:
- **Триггер (решение пользователя):** новая функциональность, рефакторинг нескольких файлов, или промпт без критериев приёмки. Точечные правки идут по текущему Working Rule 1 (пересказ в 1–5 предложениях), grill не запускается. Это пишется в `description` скилла и в Working Rule 1.
- Убрать OpenCode/Codex/`.harness/mission.md`/execution lane/design round.
- «Record the answers» → в план-файл (секция `## Intake` таблица Вопрос/Ответ/Источник) или, вне plan mode, в 1–5 предложений summary по Working Rule 1.
- `completion.md`: 5 критериев → 4 (убрать execution lane), добавить «явно названо, что НЕ нужно сейчас».
- Frontmatter: `name`, `description` (сохранить `Use when`-триггеры), `allowed-tools: Read, Glob, Grep, AskUserQuestion`.

**C2. `.claude/skills/write-a-skill/SKILL.md` — new.** Почти verbatim; в шаблоне убрать `status`/`source_evidence` (заменить на `allowed-tools`), путь примера `.harness/memory/events.jsonl` → `.claude/plans/journal/`.

**C3. `.claude/skills/tdd/` — new** (SKILL.md + tests.md, mocking.md, interface-design.md, deep-modules.md, refactoring.md). Verbatim, кроме: убрать ссылки `../../wiki/decomposition.md`, `../../wiki/verification-and-evidence.md`, абзац «In the contract». Добавить примечание: в memory-project тесты пока out of scope (CLAUDE.md), скилл — на будущее (Vitest).

### Блок D — процессные шаблоны и документация

**D1. `.claude/plans/SESSION-HANDOFF-TEMPLATE.md` — new.** Из `templates/.harness/session-handoff.md`: Mission / Current State / Completed Files / Source-Of-Truth Files / Active Decisions / Blocked Questions / **Exact Next Step** / Validation Performed / Residual Risks. Без execution lane. Инструкция: писать `.claude/plans/session-handoff.md` (gitignored? — нет, коммитить: это состояние проекта) при остановке посреди плана; удалять при закрытии плана.

**D2. `.claude/plans/TEMPLATE.md` — modify.** В `## Known limitations / follow-ups` добавить подсекцию `### Prevention` (что проверять следующему, чтобы не повторить ошибку из этого плана). В `## Tradeoffs` добавить строку-подсказку «Explicitly not needed now: …».

**D3. `.claude/skills/journal/SKILL.md` — modify.** Step 2: собирать `Prevention` из ошибок, встреченных в ходе плана (падения lint/tsc/build, ревью-находки Critical/Major). Step 1: если существует `.claude/plans/session-handoff.md` — прочитать и учесть.

**D4. `CLAUDE.md` — modify.**
- Working Rule 1: добавить «для новых фич, многофайловых рефакторингов и промптов без критериев приёмки — скилл `/intake-grill`: explore first, раунды ≤4 вопросов через AskUserQuestion, рекомендуемый вариант первым, критерии завершённости в completion.md. Точечные правки — как раньше, пересказ в 1–5 предложениях».
- Новый раздел `## Guardrails (hooks + permissions)`: что блокирует `protect-paths.sh`, что делает `gate.sh`, env-переключатели (`CLAUDE_GATE=0`, `CLAUDE_GATE_MAX`, `CLAUDE_VERIFY_LOCK=1`), как запускать `bash .claude/hooks/test-hooks.sh`, требование Git Bash, `.gitattributes`. Две гочи: (1) хуки только в shell-форме, exec-форма запустит WSL bash; (2) хуки матчат текст команды, поэтому триггерные строки (`rm -rf`, `secrets/`) писать в файл, не в heredoc.
- Environment Configuration: уточнить, что `.env.local` / `.env.*.local` защищены хуком и deny-правилами, `.env` (коммитируемые дефолты) — нет.
- Commands: упомянуть, что `eslint.config.js` игнорирует `harness-blueprint-develop/`.
- Project Skills table: `/intake-grill`, `/write-a-skill`, `/tdd`.
- Development Journal: упомянуть `session-handoff.md` и когда его писать (порог: сессия останавливается посреди плана).
- Working Rule 3: «`/finalize` остаётся каноническим путём; Stop-хук — страховка, не замена».

**D5. `.claude/plans/plan-adopt-harness-guardrails.md` — new.** Копия этого плана (для `/journal`).

---

## Дизайн хуков (детали)

### Факты, найденные при проектировании (меняют план)

| Факт | Следствие |
|---|---|
| `npm run lint` сейчас **55 с и красный** (14 ошибок): ESLint не читает `.gitignore` и сканирует `harness-blueprint-develop/**/*.ts` | **Шаг 0 обязателен:** `globalIgnores(['dist', 'harness-blueprint-develop'])` в `eslint.config.js`. Иначе Stop-гейт блокирует с первого хода и стоит минуту |
| После фикса: lint ≈ 2 с, `tsc -b` ≈ 2.5 с | Гейт ≈ 5 с, кэш не нужен |
| `bash` в Windows PATH = **WSL** (`C:\WINDOWS\system32\bash.exe`); Git Bash в `C:\Program Files\Git\bin` | Хуки только в shell-форме `"command": "bash \"${CLAUDE_PROJECT_DIR}/...\""` — Claude Code на Windows выполняет её через Git Bash. Exec-форма (`command: bash, args: [...]`) запустит WSL |
| Старт парсеров: `node -e` 65 мс, `python3` 220 мс, `jq` нет | Цепочка `jq → node → python3`, один вызов парсера на хук |
| NTFS case-insensitive: `.ENV` проходит guard | `shopt -s nocasematch` в path guard |
| Ложное срабатывание: `git commit -m "fix(ui): use .key prop"` блокируется | Ужесточить `secret_tgt`: `.pem/.key` требуют имени файла перед точкой |
| Пропуск: `echo {} > package-lock.json` проходит | Добавить `package-lock.json` и `.github/workflows/` в redirect-регэксп |
| `core.filemode=false` | `chmod` бесполезен; `git update-index --chmod=+x` |
| CLAUDE.md «Environment Configuration»: `.env` — **коммитируемые** shared defaults (Vite, `VITE_*`) | **Решение:** защищаем только `.env.local`, `.env.*.local` (они в `.gitignore` через `*.local`). `.env` остаётся редактируемым, иначе Claude не сможет добавить `VITE_CONTENT_URL`, как предписывает CLAUDE.md |

### A1 `.claude/settings.json` — точное содержимое

`defaultMode` не задаём (наследуется глобальный `auto`; deny/ask и exit 2 хуков действуют и в auto). `Write(...)`-дубликаты не нужны: `Edit`-правила покрывают все редактирующие инструменты; `Read`-deny дополнительно блокирует Edit/Write того же пути.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(git status *)", "Bash(git diff *)", "Bash(git log *)", "Bash(git show *)",
      "Bash(git blame *)", "Bash(git branch *)", "Bash(git ls-files *)", "Bash(git rev-parse *)",
      "Bash(git add *)", "Bash(git commit *)", "Bash(git switch *)",
      "Bash(git stash list *)", "Bash(git stash push *)", "Bash(git stash pop *)", "Bash(git stash show *)",
      "Bash(npm run lint *)", "Bash(npm run build)", "Bash(npm run dev *)", "Bash(npm run preview *)",
      "Bash(npm ls *)", "Bash(npm view *)", "Bash(npm outdated *)",
      "Bash(npx tsc *)", "Bash(npx eslint *)", "Bash(npx vite *)", "Bash(npx lint-staged *)", "Bash(npx commitlint *)",
      "Bash(ls *)", "Bash(rg *)", "Bash(grep *)", "Bash(find *)", "Bash(cat *)", "Bash(head *)", "Bash(tail *)", "Bash(wc *)",
      "Bash(bash .claude/hooks/test-hooks.sh *)",
      "Bash(curl * http://127.0.0.1*)", "Bash(curl * http://localhost*)",
      "Bash(curl * \"http://127.0.0.1*)", "Bash(curl * \"http://localhost*)"
    ],
    "ask": [
      "Bash(git push *)", "Bash(git rebase *)", "Bash(git checkout -- *)",
      "Bash(git branch -D *)", "Bash(git stash drop *)", "Bash(git stash clear *)",
      "Bash(npm install *)", "Bash(npm i *)", "Bash(npm ci *)", "Bash(npm uninstall *)", "Bash(npm update *)",
      "Bash(npx husky *)"
    ],
    "deny": [
      "Read(./.env.local)", "Read(./.env.*.local)",
      "Read(./**/*.pem)", "Read(./**/*.key)", "Read(./**/id_rsa*)", "Read(./**/credentials*)", "Read(./secrets/**)",
      "Edit(./.env.local)", "Edit(./.env.*.local)",
      "Edit(./package-lock.json)", "Edit(./.github/workflows/**)", "Edit(./secrets/**)",
      "Edit(./**/*.pem)", "Edit(./**/*.key)",
      "Bash(rm -rf *)", "Bash(rm -fr *)",
      "Bash(git push --force *)", "Bash(git push -f *)", "Bash(git reset --hard *)", "Bash(git clean *)",
      "Bash(sudo *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [ { "type": "command",
                     "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-paths.sh\"",
                     "timeout": 15 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command",
                     "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/gate.sh\"",
                     "timeout": 120 } ] }
    ]
  }
}
```

Curl-правила с хвостовым `*` без пробела (`127.0.0.1*`), а не `:*`: `:*` распознаётся только как суффикс, а `127.0.0.1:5173` содержит двоеточие.

### A2 `protect-paths.sh` — решения

1. `set -uo pipefail`; один вызов парсера, выдающий `tool␟file␟cmd` (`\x1f`-разделитель). Цепочка `jq → node -e → python3`. Fail-closed raw-grep fallback на нормализованном payload.
2. Сразу после извлечения: `file="${file//\\//}"`, `cmd_n="${cmd//\\//}"`. Все проверки путей — на нормализованных значениях.
3. `shopt -s nocasematch`.
4. `PROTECTED=( ".env.local" ".env.*.local" "*.pem" "*.key" "id_rsa*" "credentials*" "*.p12" "*.keystore" "package-lock.json" )`. Убраны `.gitlab-ci.yml`, `verify.sh`, pnpm/yarn/poetry/Cargo/go.sum. `.env`, `.env.example` — не защищены (см. решение выше).
5. CI-пути: только `.github/workflows/*`.
6. `secrets/` без изменений (работает после нормализации).
7. Command guard: `secret_tgt` — `.env.local`, `.env.*.local`, `[^[:space:]"']+\.(pem|key)([^[:alnum:]_-]|$)`, `id_rsa`, `credentials`, `secrets/`. Redirect-регэксп + `package-lock.json`, `.github/workflows/`. `cp|mv|tee` destination также сравнивается с `VERIFY_LOCKED` при lock. Curl: **только** pipe-to-shell и `bash <(curl …)`, общий блок curl убран. Убраны `kubectl`, `terraform`. Оставлены `rm -r -f` любой записи, `find -delete/-exec rm`, force-push (включая `git -C`), `reset --hard`, `clean -f`.
8. `CLAUDE_VERIFY_LOCK=1` (Edit/Write, `sed|awk|perl -i`, cp/mv/tee):
   `VERIFY_LOCKED=( "eslint.config.js" "tsconfig.json" "tsconfig.app.json" "tsconfig.node.json" "commitlint.config.js" "package.json" ".husky/*" "*/.husky/*" ".claude/hooks/*" "*/.claude/hooks/*" ".claude/settings.json" "*/.claude/settings.json" "*.test.*" "*.spec.*" "tests/*" "*/tests/*" "*/__tests__/*" )`.
   Самозащита хуков/settings — **только под lock**, без второго переключателя: интерактивно эти файлы должны быть редактируемы (в том числе в этой задаче), а diff их выдаёт. `settings.local.json` никогда не защищён.

### B1 `gate.sh` — решения

Переключатели: `CLAUDE_GATE=0` (выкл), `CLAUDE_GATE_MAX` (3), `CLAUDE_GATE_CMD` (override для тестов).

1. Парсинг payload один раз → `session_id`, `stop_hook_active`.
2. `cd "$CLAUDE_PROJECT_DIR"`; при провале инфраструктуры — **fail open** (exit 0 с предупреждением): Stop-хук — страховка, не security boundary; ловушка на сломанном окружении хуже пропущенного lint.
3. **Skip:** `git status --porcelain` пуст → exit 0. Затем фильтр по коду: `\.(ts|tsx|js|mjs|cjs)$|(^|/)tsconfig[^/]*\.json$|(^|/)package(-lock)?\.json$` (для `R old -> new` обе стороны). Нет совпадений → exit 0. Plan mode, правки `.md`/`.scss`/хуков — бесплатны. `.scss` исключён намеренно: ни eslint, ни tsc его не проверяют.
4. Гейты по порядку: `lint::npm run lint`, `typecheck::npx tsc -b`. Без `npm run build` (это Gate 4 `/finalize`).
5. Счётчик `${XDG_RUNTIME_DIR:-$HOME/.cache}/claude-hooks/gate.<sid>`, `mktemp`+`mv -f`, нечисловое → 0. Зелёный → `rm ctr; exit 0`. Красный и `stop_hook_active == false` → `n=0` (новая цепочка). Красный и `n >= MAX` → release с предупреждением, exit 0. Иначе `n+1`, stderr `GATE FAILED (<name>). Fix the implementation — do not edit eslint.config.js, tsconfig*.json, package.json or .claude/hooks to make it pass. Attempt N of MAX` + `tail -n 30`, exit 2.
   **Отличие от harness:** там release при любом `stop_hook_active=true`, что делает MAX фактически 1. Здесь поле идентифицирует цепочку, счётчик её ограничивает (3 реальных попытки).
6. Только `Stop` (main thread). `SubagentStop` не подключаем.

### A3 `test-hooks.sh` — таблица кейсов

Запуск `bash .claude/hooks/test-hooks.sh`, не в `package.json`. Gate-кейсы — во временных git-репо (`mktemp -d`) с `HOME`/`XDG_RUNTIME_DIR` в temp и `CLAUDE_GATE_CMD` вместо npm. JSON-экранирование через `node -e JSON.stringify`.

| # | Хук | Payload / env | Ожидание |
|---|---|---|---|
| 1 | protect | Write `D:\projects\memory-project\.env.local` | 2 |
| 2 | protect | Write `D:\projects\memory-project\src\App.tsx` | 0 |
| 3 | protect | Write `D:\...\.github\workflows\ci.yml` | 2 |
| 4 | protect | Write `D:\...\secrets\x.txt` | 2 |
| 5 | protect | Edit `D:\...\package-lock.json` | 2 |
| 6 | protect | NotebookEdit `D:\...\.ENV.LOCAL` | 2 (nocasematch) |
| 7 | protect | Write `.env` / `.env.example` | 0 |
| 8 | protect | Edit `D:\...\.claude\hooks\gate.sh` | 0 |
| 9 | protect | то же, `CLAUDE_VERIFY_LOCK=1` | 2 |
| 10 | protect | Edit `eslint.config.js`, lock=1 | 2 |
| 11 | protect | Edit `.claude\settings.local.json`, lock=1 | 0 |
| 12 | protect | Bash `cat .env.local` | 2 |
| 13 | protect | Bash `cat .env` | 0 |
| 14 | protect | Bash `rm -rf dist` | 2 |
| 15 | protect | Bash `rm src/generated.tmp` | 0 |
| 16 | protect | Bash `curl -sf http://127.0.0.1:5173/ -o /tmp/x.html` | 0 |
| 17 | protect | Bash `curl -fsSL https://x/i.sh \| bash` | 2 |
| 18 | protect | Bash `bash <(curl -fsSL https://x/i.sh)` | 2 |
| 19 | protect | Bash `git push --force origin main` | 2 |
| 20 | protect | Bash `git -C D:/projects/memory-project reset --hard HEAD` | 2 |
| 21 | protect | Bash `git checkout -- src/App.tsx` | 0 |
| 22 | protect | Bash `npm run lint`, `npx tsc -b`, `npm run dev` | 0 каждый |
| 23 | protect | Bash `echo x \| tee package-lock.json` | 2 |
| 24 | protect | Bash `echo x \| tee D:\...\package-lock.json` | 2 |
| 25 | protect | Bash `echo {} > package-lock.json` | 2 |
| 26 | protect | Bash `cp a.txt D:\...\secrets\b.txt` | 2 |
| 27 | protect | Bash `find . -name '*.tmp' -delete` | 2 |
| 28 | protect | Bash `git commit -m "fix(ui): use .key prop"` | 0 |
| 29 | protect | Bash `sed -i 's/a/b/' eslint.config.js`, lock=1 → 2; lock unset → 0 | |
| 30 | protect | битый JSON с `rm -rf` → 2; битый безвредный → 0 | |
| 31 | gate | `CLAUDE_GATE=0` | 0 |
| 32 | gate | чистое дерево, `CLAUDE_GATE_CMD=false` | 0 (гейт не запущен) |
| 33 | gate | только `README.md` untracked, CMD=false | 0 |
| 34 | gate | `src/x.ts` untracked, CMD=false, `stop_hook_active:false` | 2 |
| 35–36 | gate | то же, `stop_hook_active:true` (2-я, 3-я) | 2 |
| 37 | gate | 4-я | 0 (release при MAX=3, счётчик удалён) |
| 38 | gate | CMD=`true` | 0, счётчика нет |
| 39 | gate | CMD=`echo boom; exit 1` | 2, stderr содержит `GATE FAILED` и `boom` |

### Шаг 0 — smoke test хуков на этой машине

Временный `.claude/hooks/smoke.sh` (всегда exit 0), пишет в `.claude/hooks/smoke.log` (gitignored через `*.log`): `uname -s`, `$BASH_VERSION`, `$MSYSTEM`, `$CLAUDE_PROJECT_DIR`, наличие `node/python3/jq`, сырой payload. Подключить временно в `settings.local.json` на `PreToolUse` (все матчеры) и `Stop`. Ожидание: `uname=MINGW64_NT…` (Git Bash, не WSL `Linux`), `file_path` с обратными слэшами, `CLAUDE_PROJECT_DIR=D:\projects\memory-project`, Stop-payload с `stop_hook_active`. Если лог не появляется — проверить `~/.claude/debug/`, `/hooks`; если шелл оказался PowerShell — задать `CLAUDE_CODE_GIT_BASH_PATH="C:\Program Files\Git\bin\bash.exe"`. После — удалить `smoke.sh`, лог и временный wiring.

### Риски

1. Забытый Шаг 0 (eslint ignore) → гейт красный и медленный с первого хода.
2. Переход на exec-форму в будущем молча запустит WSL bash. Задокументировать в CLAUDE.md.
3. CRLF в рабочей копии → `$'\r': command not found`. `.gitattributes` чинит checkout; в verification проверять `grep -c $'\r'`.
4. Хуки матчат текст, не семантику: heredoc с `rm -rf` или `secrets/` в прозе блокируется. Смягчено для `.key/.pem`; остальное задокументировать («триггерный текст писать в файл, не инлайн»).
5. Skip при чистом дереве: красный `tsc`, закоммиченный без `/finalize`, пройдёт мимо Stop-гейта (lint-staged не запускает tsc). Принято для соло-репо.
6. Lock-tier только для автономных прогонов: интерактивно Claude может править `gate.sh`/`eslint.config.js`; выдаёт diff. Принято ради редактируемости.
7. `permissions.ask` бьёт более специфичный `allow` — поэтому `git restore` не в списках вовсе.

---

## Implementation Order

0. **A0 eslint ignore** → `time npm run lint` ≤ 3 с и зелёный. Затем **smoke test хуков** (см. «Дизайн хуков → Шаг 0»): убедиться, что Claude Code на этой машине запускает bash-хук через Git Bash, а не WSL. Без этого остальное бессмысленно.
1. A4 `.gitattributes` (до создания `.sh`, чтобы они сразу легли с LF).
2. A2 `protect-paths.sh`, A3 `test-hooks.sh` → `bash .claude/hooks/test-hooks.sh` зелёный (39 кейсов).
3. B1 `gate.sh` → кейсы 31–39 в test-hooks + ручная проверка в живой сессии.
4. A1 `settings.json` (wiring) → живая проверка: Edit `.env.local` блокируется, `cat .env.local` блокируется, `npm run lint` не спрашивает разрешения, `git push` спрашивает.
5. C1–C3 скиллы.
6. D1–D4 шаблоны и CLAUDE.md.
7. D5 копия плана → `/finalize` → `/journal` → `/commit` (несколько коммитов: `chore(config): add protect-paths and gate hooks`, `chore(config): add intake-grill, write-a-skill, tdd skills`, `docs(global): document guardrails and session handoff`).

---

## Verification

- `bash -n .claude/hooks/*.sh` проходит; `grep -c $'\r' .claude/hooks/*.sh .gitattributes` = 0 для каждого; `git ls-files --stage .claude/hooks` показывает `100755`; `git check-attr eol .claude/hooks/gate.sh` → `lf`.
- Smoke-лог показал `MINGW64_NT`, обратные слэши в `file_path`, `CLAUDE_PROJECT_DIR=D:\projects\memory-project`, Stop-payload с `stop_hook_active`; smoke-файлы и временный wiring удалены.
- `time npm run lint` ≤ 3 с и зелёный после A0; `npx tsc -b` зелёный; `npm run build` зелёный.
- `bash .claude/hooks/test-hooks.sh` — все 39 кейсов (Windows-пути!) OK, exit 0.
- Живая сессия: `cat .env.local` → BLOCKED со stderr хука; Write `secrets/probe.txt` → BLOCKED; `curl -sf http://127.0.0.1:5173/` без промпта (при запущенном dev); `git push` спрашивает.
- Stop-хук: намеренная TS-ошибка в `src/lib/utils.ts` → блок с хвостом tsc → фикс → следующий Stop проходит, файл `~/.cache/claude-hooks/gate.<sid>` удалён. Plan-mode/doc-only ход с грязным не-код деревом завершается без задержки.
- `CLAUDE_VERIFY_LOCK=1 claude`: Edit `eslint.config.js` и `.claude/hooks/gate.sh` → BLOCKED; Edit `src/App.tsx` → проходит.
- `/intake-grill` вызывается как slash-команда и задаёт вопросы через AskUserQuestion.
- CLAUDE.md drift check: описанные хуки/скиллы существуют по указанным путям.

---

## Процесс разработки до и после (согласовано с пользователем)

### Сейчас
1. Задача в чат → Working Rule 1: пересказ в 1–5 предложениях, свободные вопросы без критерия «достаточно».
2. Крупное → plan mode; план в `~/.claude/plans/`, невидим для `/journal`.
3. Реализация; защита только промптом (`defaultMode: auto`, deny-списка нет).
4. Проверка — когда вспомнили `/finalize`. Красный `tsc` в конце сессии никто не замечает.
5. `/journal` фиксирует «почему»; обрыв посреди плана → следующая сессия восстанавливает контекст по diff.
6. `/commit` руками.

### После
1. **Intake.** Новая фича / многофайловый рефакторинг / промпт без критериев приёмки → `intake-grill`: сначала поиск ответов в репо, затем раунды ≤4 вопросов через AskUserQuestion, рекомендуемый вариант первым; критерии «done»: измеримый результат, ≥1 проверяемый критерий приёмки, названы риски, названо что явно не нужно. Точечные правки — как раньше.
2. **Plan mode** как сейчас + копия плана в `.claude/plans/plan-*.md`.
3. **Реализация под охраной.** `protect-paths.sh` невидим, пока всё нормально; опасное действие → отказ с причиной, Claude идёт другим путём, промптов пользователю нет.
4. **Гейт на каждом завершении хода.** Если менялись ts/tsx/json-конфиги → lint + tsc (~5 с). Красный → Claude чинит, максимум 3 круга, затем release с предупреждением. Чистое дерево, `.md`/`.scss`, plan mode → гейт молчит.
5. **`/finalize`** остаётся каноническим путём; lint/tsc там уже зелёные, остаются reviewer, build, journal.
6. **Обрыв посреди плана** → `session-handoff.md` с Exact Next Step.
7. **`/journal`** + Prevention.
8. **Автономный прогон** → `CLAUDE_VERIFY_LOCK=1`.

### Сравнение
| Стадия | Сейчас | После | Цена |
|---|---|---|---|
| Уточнение | Свободный текст | Структурированные раунды, 4 критерия «done» | Больше вопросов в начале |
| Безопасность | Только промпт | deny + хук, exit 2 не обходится уговорами | Ложные срабатывания на тексте команд |
| Проверка | По памяти через `/finalize` | Автоматически при завершении хода | ~5 с на ход при изменённом коде |
| Ослабление гейта | Не запрещено | Заблокировано под lock | Только для автономных прогонов |
| Передача между сессиями | Journal + diff | + session-handoff | Дисциплина писать при обрыве |
| Учёт ошибок | Нет | Prevention в journal | Минута на запись |
| Права | Глобальный auto, ad-hoc local | Явные allow/ask/deny в проекте | `git push`, `npm install` спрашивают |

### Что почувствует пользователь
- Вопросов в начале больше, но в форме «выбери вариант».
- Завершение хода иногда +5 с; иногда Claude «не отпускает» ход, пока чинит tsc.
- Некоторые команды Claude выполнить не сможет (`rm -rf dist`) — запускает пользователь.
- Обслуживать: два хука, тест-скрипт, `.gitattributes`.
- Ложные срабатывания: коммит-сообщение со словом `credentials`, heredoc с `rm -rf`. Обход — писать текст в файл.

---

## Приложение: анализ Cactus Blueprint Harness

### Что это
Repo-native «операционная дисциплина» вокруг агента: markdown + один bash-скрипт. Цикл: Intake Grill → `mission.md` (+ Tooling And Approach Assessment) → `validation.md` до кода → одобрение → реализация с петлёй на `verify.sh` (exit 0/1/2) → `code-reviewer` + `goal-verifier` → `handoff.md` → человек решает merge. Аудитория: команда с GitLab + Jira + Confluence. Тройная поддержка Claude/OpenCode/Codex → скиллы в трёх байт-идентичных копиях.

### Состав
| Слой | Содержимое | Оценка |
|---|---|---|
| Хуки | `protect-paths.sh`, `verify-gate.sh`, `format.sh`, `grill-guard.sh`, `mission-state-guard.sh` | Первые три переносимы; два последних завязаны на `.harness/mission.md` |
| Агенты | `code-reviewer`, `goal-verifier` (readOnly), `project-interviewer`, `test-runner` | Портируемы, но свой reviewer сильнее |
| Команды | `/blueprint`, `/start-mission`, `/orchestrate`, `/review`, `/commit` | Первые две — сердце harness |
| Скиллы | `intake-grill`, `write-a-skill`, `tdd` (дженерики); `design-direction`, `jira-triage`, `confluence-docs` (привязаны) | |
| Память | `events.jsonl` + `lessons.md` + `harness-memory.sh record/resolve/audit` | Идея failure→machinery уникальна; `lessons.md` дублирует CLAUDE.md |
| Установщик | 585 строк bash, манифест SHA-256, `--verify/--migrate-v1/--rollback` | Windows не упомянут ни разу |
| `optional/` | 9 паков (process богатый; api/backend/qa — только md) | 7 из 9 без README |
| `tooling/claude-onboard` | Node CLI | Legacy, «do not extend» |

### Пять идей
1. Гейт 0/1/2 — состояние «unconfigured» не даёт прикинуться зелёным.
2. `CLAUDE_VERIFY_LOCK=1` — агент не правит гейт, который его судит (включая `sed -i`, `cp`, `tee`, редиректы).
3. Два handoff-файла: доказательства для человека vs Exact Next Step для следующей сессии.
4. Failure → machinery: `record` → guard → `resolve --converted-to` → `audit`.
5. Intake Grill с критериями завершённости + вопрос «что явно НЕ нужно сейчас».

### Не брать
Тройное зеркалирование; `mission-state-guard`/`grill-guard` (рукописный plan mode); `lessons.md`; Jira/Confluence/GitLab; установщик; `check-reconstruction.sh`; decomposition в DAG.

### Windows-риски (проверены)
`D:\proj\secrets\x` и `D:\proj\.github\workflows\ci.yml` → exit 0 (fail open) из-за `case ... secrets/*`. Basename-глобы работают только благодаря MSYS `basename`. Нет `eol=lf`. `jq` нет, fallback `python3`.

### Сравнение с текущей конфигурацией пользователя
| У пользователя | В harness | Вывод |
|---|---|---|
| `/finalize` | Stop-хук | `/finalize` надо помнить; хук срабатывает сам |
| `pedantic-code-reviewer` 27 КБ | `code-reviewer` 2 КБ | Свой сильнее |
| `/journal` | `events.jsonl` + `session-handoff.md` | Не хватает «что дальше» и prevention |
| Working Rule 1 | `intake-grill` | Есть требование, нет метода |
| `defaultMode: auto`, без deny | allow/ask/deny + хуки | Нет ни одной границы |
