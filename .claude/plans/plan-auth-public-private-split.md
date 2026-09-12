# Plan — Public / private split with fake auth (`/` + `/memory`)

## Context

Мемориальный сайт сегодня — один вертикальный скролл (`HomePage` → 6 секций) без роутера и без состояния доступа. Следующий шаг по Frontend Spec §15 («User accounts / Private content»): приложение делится на публичное состояние (`/`: Intro + Hero + тихая кнопка «Авторизоваться») и приватное (`/memory`: полный опыт как сейчас). Бэкенда нет — логин формальный, но роутинг, защита маршрутов и абстракция `authService` делаются сразу, чтобы потом подменить мок на реальный провайдер без переписывания Hero, модалки, гарда и секций.

Источник дизайна: Claude Design проект `aac7109b…`, файлы `Auth.dc.html` (обложка, 5 состояний) и `AuthScreen.dc.html` (экран: public / login / register / pending / authed, светлая и тёмная, 1440 и 390). Цвета, шрифты и Hero совпадают с текущим проектом; новое — CTA внизу Hero, пилл «Выйти», модальное окно с тремя видами и два токена (`--line`, `--scrim`).

## Intake (решения пользователя, 2026-09-12)

| Вопрос | Решение |
|---|---|
| Состав регистрации | Полный дизайн: Email, Телефон, Пароль, Повтор, «Кем вы были для Ларисы Ивановны», примечание; отдельный вид «Заявка на рассмотрении» |
| Роутер | `react-router@^7` (7.18.x; v8 требует React ≥ 19.2.7, установлен 19.2.4) |
| Мок-логин | **Формальность**: любая пара, прошедшая валидацию формы, авторизует. `{ email }` в localStorage. Регистрация и pending ничего не сохраняют (register → показывает pending-вид) |
| Доступ к другим видам модалки | Кроме «Авторизоваться» — **две временные фейковые кнопки** на публичном Hero, открывающие модалку сразу в видах Register и Pending (QA без бэкенда; помечены `TEMP` в коде) |
| Модалка | **Один общий `Modal`** с регионами **header / body / footer**; `max-height: 90vh`, скроллится только body. Контент — отдельные компоненты (`LoginForm`, `RegisterForm`, `PendingNotice`) |
| Кнопки | Как в дизайне: «Авторизоваться» внизу Hero вместо «дальше» (публичный Hero = один экран); «Выйти» — fixed-пилл справа сверху слева от `ThemeToggle`, только на `/memory`, gated на `!introVisible` |
| Валидация | Умеренная: email формат; пароль ≥ 8; повтор совпадает; телефон обязателен, 10–15 цифр после очистки `[\s()-]`, опц. `+`; текст ≥ 20 символов. Ошибки — тихий текст под полем, `var(--accent-warm)`, без красного. Проверка на submit, затем поле перепроверяется при вводе |
| Authed на `/` | `<Navigate to="/memory" replace />` |
| Unauth на `/memory` | `<Navigate to="/" replace />`, приватные секции не рендерятся |
| Ручная проверка | Пользователь смотрит в `npm run dev` до коммита; коммит только через `/commit` |

**Явно не нужно сейчас:** реальный API, хэширование паролей, «запомнить меня», восстановление пароля, admin-панель, UI-библиотека, тесты, портал для модалки, полный focus-trap (только autofocus + возврат фокуса), анимации сложнее fade, правки sealed-спеков в `.claude/foundation/`.

---

## Architecture decisions

| Decision | Choice | Why |
|---|---|---|
| Роутер | `react-router@^7`, импорты из `'react-router'` (`BrowserRouter, Routes, Route, Navigate, useNavigate`) | Один пакет, React 19 ок, готов к `/admin` |
| Auth-состояние | `src/auth/`: `authService.ts` (интерфейс + мок), `authContext.ts` (объект контекста), `AuthProvider.tsx`, `useAuth.ts` | CLAUDE.md называет auth допустимым поводом для глобального состояния; Context — минимум. Контекст и хук в отдельных файлах из-за `react-refresh/only-export-components` |
| `authModalOpen`/`authMode` | Одно локальное состояние `modal: AuthView \| null` в `AuthCta` | Нет потребителей вне публичного Hero; после логина страница размонтируется |
| Hero без дублирования | `HeroSection({ content, visible, variant })`: `public` → рендерит `AuthCta` вместо `ScrollHint` и модификатор `.public`; `private` → как сегодня | Одна секция, контент не меняется |
| Страницы | Одна `HomePage({ variant: 'public' \| 'private' })` — intro-lifecycle, `<main>`, секции только для `private`, `SignOutButton` только для `private` | Ноль дублирования |
| Guards | `RequireAuth`, `PublicOnly` в `src/auth/` | Декларативные маршруты в `App.tsx`. `AuthProvider` инициализируется синхронно из localStorage → без «loading»-мерцания, F5 на `/memory` не прыгает через `/` |
| Modal | Встроенный header (title + lede + ✕), body = `children` (скролл), слот `footer`. Каждый вид сам рендерит `<Modal>`; submit-кнопка в футере связана с `<form id>` в body через атрибут `form` | Header у всех трёх видов одинаковой формы; форма не рвётся между слотами; Enter в поле отправляет форму |
| Возврат фокуса | `AuthCta` запоминает `document.activeElement` в обработчике открытия и фокусирует его в `close()` | Modal остаётся без знания об опенере; смена вида (remount Modal) не ломает возврат |
| Токены | `--line`, `--scrim` в `index.css` (`:root` + `[data-theme="dark"]`) | Из дизайна; scrim закрывает Design Foundation §2 `--color-overlay` |
| Глобальный reset | `button, input, textarea { font-family: inherit; }` | Reset того же класса, что существующий `button` |
| z-index | Modal 60 | Между Lightbox 50 и IntroOverlay 100; ThemeToggle 40 под скримом |
| Публичный Hero на коротких экранах | `.public { min-height: 100svh (fallback 100vh); flex-direction: column }`, grid `margin: auto 0`, footer в потоке `margin-top: auto`; в `.public` картинка ограничена `max-width: 416px` (≤720px: `240px; margin: 0 auto`) — как в дизайне | Один экран на нормальных вьюпортах, без клиппинга на 768px-ноутбуках и 390×844 |
| commitlint | Добавить scope `auth` | CLAUDE.md: новые scope только явно |
| Plan file | Копия в `.claude/plans/plan-auth-public-private-split.md` | Ограничение `/journal` |

---

## Files

### New — `src/auth/`
| File | Purpose |
|---|---|
| `authService.ts` | `AuthUser { email }`, `RegisterInput { email, phone, password, relationship }`, `interface AuthService { getSession(): AuthUser \| null; login(email, password): Promise<AuthUser>; register(input): Promise<void>; logout(): Promise<void> }`; `export const authService = createMockAuthService()` — JSON в `localStorage[AUTH_SESSION_KEY]` в try/catch. `getSession` синхронный (для lazy `useState`), остальное async — шов для бэкенда |
| `authContext.ts` | `AuthContextValue { user, login, register, logout }`, `AuthContext = createContext<AuthContextValue \| null>(null)` |
| `AuthProvider.tsx` | default export; `useState(() => authService.getSession())`; `login` → `setUser(await authService.login(...))`, `logout` → `await authService.logout(); setUser(null)` |
| `useAuth.ts` | named hook, бросает вне провайдера |
| `RequireAuth.tsx` / `PublicOnly.tsx` | `{ children: ReactNode }` → `children` или `<Navigate replace />` |
| `validators.ts` | `FieldError = 'required' \| 'email' \| 'passwordShort' \| 'passwordMismatch' \| 'phone' \| 'relationshipShort'`; `LoginValues`, `RegisterValues`, `Errors<T>`, `validateLogin`, `validateRegister`, `hasErrors`. Чистые функции, без i18n |

### New — `src/components/ui/` (generic primitives)
| File | Purpose |
|---|---|
| `Modal.tsx` + `.module.scss` | `{ title, lede?, footer?, closeLabel, onClose, children }`. `.backdrop` fixed inset 0, z 60, `var(--scrim)`, padding 24px; `.card` `display:flex; flex-direction:column; width:440px (≤720: 342px); max-width:100%; max-height:90vh; background:var(--bg); border:1px solid var(--line); radius 3px; shadow 0 24px 70px rgba(20,15,8,.22)`; `.header` padding `44px 44px 0` (≤720: 28px), title serif 32/28px w400, lede sans 12.5px muted, ✕ 36×36 абсолютно top/right 12px (две линии stroke 1.2); `.body` `flex:1 1 auto; min-height:0; overflow-y:auto; padding: 24px 44px 0`; `.footer` `padding: 24px 44px 44px`. A11y: `role="dialog" aria-modal aria-labelledby={useId()}`; Escape через `window` keydown (паттерн Lightbox); клик по скриму закрывает только если `pointerdown` тоже был на скриме; body scroll lock (`document.body.style.overflow`, восстановить prev); эффект «если фокус не внутри карточки — сфокусировать первый `input, textarea, button`». Все `setState` — только в обработчиках |
| `TextField.tsx` + `.module.scss` | `{ id, label, value, onChange(value), error?, type?, multiline?, placeholder?, autoComplete?, inputMode?, autoFocus? }` — закрытый список пропов, рендерит `<input>` или `<textarea>`; `aria-invalid`, `aria-describedby` на `<p id=…-error>`. Стили: label sans 10px .25em uppercase muted; control `min-height:48px; padding:0 14px; border:1px solid var(--line); radius 2px; background:transparent; color:var(--text); font 14px var(--sans); width:100%`; `:focus-visible { outline:none; border-color:var(--muted) }`; textarea `min-height:108px; padding:12px 14px; resize:vertical`; ≤720: 52px / 16px / 136px; `.error` sans 11px `var(--accent-warm)` |
| `Button.tsx` + `.module.scss` | `{ variant?: 'primary' \| 'outline' \| 'text' (default outline), type?: 'button' \| 'submit' (default button), form?, onClick?, disabled?, className?, children }`. База: min-height 48px, sans 11px .3em uppercase, radius 2px, `:focus-visible` outline 1px `var(--muted)` offset 3px. `outline`: padding 14px 30px, border `var(--line)`, transparent, `color:var(--text)`, opacity .8→1 hover. `primary`: `background:var(--text); color:var(--bg)`, width 100%. `text`: без рамки, sans 10px, `var(--muted)`, padding 6px 8px |

### New — `src/components/auth/`
| File | Purpose |
|---|---|
| `AuthCta.tsx` + `.module.scss` | Футер публичного Hero: рулька 1px×40px (≤720: 28px) `var(--muted)` opacity .3, `Button outline` «Авторизоваться», под ней две `Button text` **TEMP** (открывают register / pending). Состояние `modal: AuthView \| null`, `openerRef` для возврата фокуса; рендерит активный вид. Возвращает `null`, пока `visible` false; появление — `opacity 1400ms ease 1800ms` как `.scrollHint`; **без `transform`** (иначе сломается `position: fixed` модалки) |
| `AuthModal.tsx` | `export type AuthView = 'login' \| 'register' \| 'pending'`; `{ initialView, ui, onClose }`; `view` и `pendingEmail` в `useState`; `useAuth` + `useNavigate`: `onLogin` → `await login(); onClose(); navigate('/memory')`; `onRegister` → `await register(input); setPendingEmail(email); setView('pending')` |
| `LoginForm.tsx` + `.module.scss` | Рендерит `<Modal>`; body: `<form id noValidate>` Email, Пароль; footer: `Button primary type=submit form={id}` «Войти» + `AuthSwitch` «Нет аккаунта? Зарегистрироваться» |
| `RegisterForm.tsx` + `.module.scss` | Body: Email, Телефон, Пароль, Повторите пароль, textarea «Кем вы были…», `AuthNote`; footer: «Зарегистрироваться» + `AuthSwitch` «Уже есть аккаунт? Войти» |
| `PendingNotice.tsx` + `.module.scss` | Body: строка статуса (точка 7px `var(--accent-warm)`, email, тег «на проверке» sans 10px .2em uppercase muted), `AuthNote`; footer: `Button outline` «Понятно» (закрыть) + `AuthSwitch` «Другая почта? Войти заново» |
| `AuthSwitch.tsx` + `.module.scss` | `{ question, action, onAction }` — центр, sans 12px muted, action = `<button>` как инлайн-текст `color:var(--text); border-bottom:1px solid var(--line)` |
| `AuthNote.tsx` + `.module.scss` | `{ children }` — `padding-left:14px; border-left:1px solid var(--line)`, sans 12px muted |
| `SignOutButton.tsx` + `.module.scss` | fixed `top:22px; right:68px; z-index:40; padding:6px 12px; border:1px solid var(--line); radius 2px; sans 10px .3em uppercase; color:var(--muted)`; fadeIn как ThemeToggle; `await logout(); navigate('/')` |
| `errorText.ts` | `errorText(ui, code)` → `ui.authErr* ?? 'русский'` |

### Modified
| File | Change |
|---|---|
| `src/App.tsx` | `QueryClientProvider > AuthProvider > BrowserRouter > Routes`: `/` → `<PublicOnly><HomePage variant="public"/></PublicOnly>`, `/memory` → `<RequireAuth><HomePage variant="private"/></RequireAuth>`, `*` → `<Navigate to="/" replace/>` |
| `src/pages/HomePage.tsx` | проп `variant`; секции About…Final и `SignOutButton` только при `private`; остальное без изменений |
| `src/sections/HeroSection.tsx` + `.module.scss` | проп `variant`; `.public` (см. решения); `AuthCta` вместо `ScrollHint` для public |
| `src/lib/utils.ts` | `export const AUTH_SESSION_KEY = 'memorial:authUser'` |
| `src/index.css` | токены `--line`/`--scrim` (light `rgba(45,36,32,.20)` / `rgba(26,20,12,.42)`; dark `rgba(242,242,242,.22)` / `rgba(0,0,0,.66)`); reset `button, input, textarea` |
| `public/content.json` | новые плоские ключи `ui.auth*` (ниже) |
| `commitlint.config.js` | `'auth'` в `scope-enum` |
| `package.json` (+lock через npm) | `react-router` |
| `CLAUDE.md` | дрейф: «SPA, no router» → роутер и маршруты; папки `src/auth/`, `components/auth/`; лестница z-index 40/50/**60**/100; ключи `memorial:authUser`; «only persisted flag» → два ключа; out-of-scope без «Authentication · routing»; заметка про history-fallback на статическом хостинге; новые ui-примитивы `Modal/TextField/Button` |

### `content.json` → `ui` (значения = инлайн-фолбэки в коде)
`authSignIn` Авторизоваться · `authSignOut` Выйти · `authClose` Закрыть · `authTitleLogin` Войти · `authLedeLogin` Вход в личное пространство памяти. · `authTitleRegister` Создать аккаунт · `authLedeRegister` Укажите, кем вы были для Ларисы Ивановны. Каждая заявка рассматривается лично. · `authTitlePending` Заявка на рассмотрении · `authLedePending` Заявка отправлена ранее. Доступ пока не открыт. · `authEmail` Email · `authEmailPlaceholder` имя@почта.ру · `authPhone` Телефон · `authPhonePlaceholder` +7 900 000-00-00 · `authPassword` Пароль · `authPasswordConfirm` Повторите пароль · `authRelationship` Кем вы были для Ларисы Ивановны · `authRelationshipPlaceholder` Пример: Здравствуйте, меня зовут Лидия Александровна. Мы работали вместе с Ларисой Ивановной в Гомельоблдорстрое в 2002–2005 годах. · `authNoteRegister` Каждая заявка рассматривается лично. Если указанных сведений окажется недостаточно для подтверждения, будет сделан звонок по указанному номеру телефона. · `authNotePending` Каждая заявка рассматривается лично. Если указанных сведений окажется недостаточно для подтверждения, будет сделан звонок по номеру телефона из заявки. После подтверждения доступ открывается — вход выполняется с той же почтой и паролем. · `authSubmitLogin` Войти · `authSubmitRegister` Зарегистрироваться · `authNoAccount` Нет аккаунта? · `authGoRegister` Зарегистрироваться · `authHaveAccount` Уже есть аккаунт? · `authGoLogin` Войти · `authPendingTag` на проверке · `authOk` Понятно · `authOtherEmail` Другая почта? · `authLoginAgain` Войти заново · `authErrRequired` Обязательное поле · `authErrEmail` Проверьте адрес почты · `authErrPasswordShort` Не короче 8 символов · `authErrPasswordMismatch` Пароли не совпадают · `authErrPhone` Телефон: от 10 до 15 цифр · `authErrRelationshipShort` Расскажите чуть подробнее — не меньше 20 символов · `authDevRegister` тест: регистрация · `authDevPending` тест: заявка · `authPendingEmailSample` имя@почта.ру

---

## Key mechanics

**Remount на смене маршрута.** `/` и `/memory` оборачивают `HomePage` разными гардами → React размонтирует и монтирует `HomePage` заново. `introVisible`/`heroVisible` берутся из `introSeen` в инициализаторе `useState`, а `introSeen` уже выставлен (CTA появляется только после интро) → интро не повторяется, Hero сразу `.visible`.

**Форма без библиотеки.** `values`, `errors`, `submitted`, `submitting` в `useState`; `update(field)` пересчитывает ошибку поля (и `confirm` при смене `password`) только после первого submit; `handleSubmit` → `validate*` → `hasErrors` → `await onSubmit`. Ни одного `setState` в эффекте. `<form noValidate>`.

**Modal и StrictMode.** Эффекты трогают только DOM (listener, `body.style.overflow`, `focus()`), идемпотентны при двойном запуске. `ref.current` не читается в рендере (`react-hooks/refs`).

**История на хостинге.** `vite dev`/`preview` отдают `index.html` для `/memory`. Статический хостинг требует rewrite (`/* → /index.html 200`) — записать в CLAUDE.md, не делать сейчас.

---

## Implementation steps

1. `npm install react-router@^7` (permission ask) → `npm ls react-router` = 7.18.x. Добавить `auth` в `commitlint.config.js`. Скопировать этот план в `.claude/plans/plan-auth-public-private-split.md`.
2. `utils.ts` (`AUTH_SESSION_KEY`), `index.css` (токены, reset).
3. `src/auth/`: `authService`, `authContext`, `AuthProvider`, `useAuth`, `validators`.
4. `RequireAuth`, `PublicOnly`, `HomePage({ variant })`, `App.tsx` маршруты. Проверка: `/` — только Hero; `/memory` → `/`; вручную положить `{"email":"a@b.c"}` в `memorial:authUser` → `/` → `/memory`, F5 остаётся.
5. Примитивы `Button`, `TextField`, `Modal`.
6. `HeroSection` `variant` + `.public`; `AuthCta` с рулькой, CTA, TEMP-кнопками и `AuthModal`-заглушкой.
7. `errorText`, `AuthSwitch`, `AuthNote`, `LoginForm`, `RegisterForm`, `PendingNotice`, `AuthModal`.
8. `SignOutButton` в `HomePage` (private, `!introVisible`).
9. `content.json` ключи (добавлять по ходу; фолбэки проверить временным удалением ключа).
10. CLAUDE.md drift → `/finalize` (lint → tsc → reviewer → build → `/journal`; журнал фиксирует, что Frontend Spec §3 «no routing» для auth-фазы снят). Коммит — отдельно через `/commit` после ручной проверки.

---

## Verification

Автоматика: `npm run lint`, `npx tsc -b`, `npm run build`, `npm run preview` + F5 на `/memory`.

Вручную (`npm run dev`, чистые `memorial:*`):
- `/`: интро → Hero → рулька + «Авторизоваться» + две мелкие TEMP-кнопки появляются вместе с Hero; подсказки «дальше» нет; на десктопе страница не скроллится; 390px — картинка 240px, всё в один экран.
- CTA → модалка «Войти»: фокус в Email; Tab: email → пароль → «Войти» → ссылка → ✕; Escape и клик по скриму закрывают; выделение текста в поле с отпусканием на скриме — не закрывает; после закрытия фокус на CTA.
- Пустой submit → два тихих тёплых текста; ввод валидного email гасит ошибку live; пароль из 7 символов держит ошибку до 8-го.
- Валидный логин → модалка закрыта, URL `/memory`, интро не повторяется, Hero виден сразу, About…Final на месте, «Выйти» слева от темы, в localStorage `{"email":…}`.
- F5 на `/memory` остаётся; `/` при сессии → `/memory`; Back после логина снова `/memory`.
- «Выйти» → `/`, ключ удалён, публичный Hero; F5 на `/memory` → `/`.
- Регистрация: переключение из логина; телефон `+7 (900) 000-00-00` проходит, `12345` нет; несовпадение паролей; textarea < 20; валидный submit → pending с введённой почтой, localStorage не тронут; «Понятно» закрывает; «Войти заново» → логин с фокусом в Email.
- Регистрация на 390×844 и на десктопе при высоте окна 700px: header и footer стоят, скроллится только body, карточка ≤ 90vh.
- TEMP-кнопки открывают Register / Pending напрямую (pending с sample-почтой).
- Scroll lock: на 390px фон не скроллится при открытой модалке, после закрытия — скроллится.
- Тёмная тема: `--line`/`--scrim` меняются, текст в инпутах `var(--text)`, ✕ и точка видны, пилл читается; переключение темы при открытой модалке — скрим поверх тоггла.
- `/memory` → «сначала» в финале → reload остаётся на `/memory`, интро играет, «Выйти» скрыт на время интро; Lightbox работает, Escape закрывает только его.
- `/foo` → `/`.

## Addendum (после ручной проверки, 2026-09-12): интро при каждой перезагрузке

**Проблема.** Интро гейтится флагом `memorial:introSeen` в localStorage (старое поведение до auth-фазы), поэтому после первого просмотра оно не показывается ни на `/`, ни на `/memory` — только через «сначала» в финале. Пользователь хочет: интро играет **при каждой загрузке страницы** на обоих маршрутах, но **не** при клиентском переходе `/` → `/memory` после логина (и обратно после выхода).

**Решение.** Флаг «интро уже сыграло» живёт ровно столько, сколько живёт страница — переменная уровня модуля вместо localStorage.

| File | Change |
|---|---|
| `src/pages/HomePage.tsx` | Module-level `let introPlayedThisLoad = false`; `useState(!introPlayedThisLoad)` / `useState(introPlayedThisLoad)` для `introVisible`/`heroVisible`; в `onIntroComplete` → `introPlayedThisLoad = true`. Убрать `useLocalStorageFlag`/`INTRO_SEEN_KEY`. Клиентский remount `HomePage` при смене маршрута читает флаг из модуля → интро не повторяется; F5 сбрасывает модуль → интро играет |
| `src/sections/FinalSection.tsx` | `replay = () => window.location.reload()` — очистка флага больше не нужна; убрать импорты хука и ключа |
| `src/hooks/useLocalStorageFlag.ts` | **Удалить** — потребителей не осталось (мёртвый код) |
| `src/lib/utils.ts` | Удалить `INTRO_SEEN_KEY` |
| `CLAUDE.md` | Таблица `hooks/` (убрать `useLocalStorageFlag.ts`), `lib/utils.ts` (убрать `INTRO_SEEN_KEY`), абзац «State lives where it's used» (persisted keys: `memorial:theme`, `memorial:authUser`; интро — module-level flag на время жизни страницы), `pages/` описание |

**Проверка.** F5 на `/` → интро → Hero + CTA. Логин → `/memory` без интро. F5 на `/memory` → интро → полная страница, «Выйти» скрыт на время интро. «Выйти» → `/` без интро. «Сначала» в финале → reload → интро. Пропуск интро кликом/«пропустить» работает как раньше. `localStorage` больше не содержит `memorial:introSeen` (старое значение у существующих посетителей просто игнорируется).

## Risks
- `react-router` без диапазона поставит 8.x и не пройдёт peer-check → пинить `^7`.
- Любой `transform`/`filter` на `.section` или футере Hero сломает `position: fixed` модалки — только `opacity`.
- Двойная навигация после логина (`navigate('/memory')` + `PublicOnly`): React 19 батчит; если в devtools проявится лишний redirect — оставить только гард.
- Foundation-спеки теперь противоречат реальности в пункте «no routing» — не править sealed-доки, объяснить в журнале и CLAUDE.md.
