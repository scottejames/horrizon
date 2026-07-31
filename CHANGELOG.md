# Changelog

Notable changes to Horizon, newest first. See
`.claude/skills/update-project-artifacts/SKILL.md` for how this file is
kept current.

## 2026-07-31

### Added

- Four items from `TODO.md`'s "Up next": each Area's collapsed/expanded
  state now persists across reloads (`localStorage`, keyed by area id);
  a search/priority/project filter and a Priority/Alphabetical/Project
  sort mode above each horizon list (`src/lib/taskListView.ts`, with its
  own unit tests — the open/deferred/done grouping stays the primary sort
  key regardless of mode); a task's priority can now be changed after
  creation via a dropdown on the priority signal (`updatePriority` in
  `TaskStoreContext`); and a rapid multi-task quick-add scoped to a
  project inside its drawer, defaulting to Someday unless a schedule
  keyword is typed (required adding `horizonExplicit` to `parseQuickAdd`'s
  return so a caller can tell "no keyword" apart from "the keyword was
  today"). The fifth "Up next" item — a real review mechanism for
  forgotten Someday tasks — was deliberately skipped: it's flagged in
  `TODO.md` as explicitly not a priority and is more of an open design
  question than a scoped feature.

### Changed

- Rescheduling a task is now one click instead of two: the "Defer ▾"/
  "Schedule ▾" dropdown is replaced by three always-visible, color-coded
  buttons per task row — one for each horizon the task *isn't* currently
  on (`Tdy`/`Tmrw`/`Wk`/`Sd`, colored the same as the horizon tabs and
  drawer dots). Applies uniformly to every horizon, not just Someday. See
  design-principles.md's "Rescheduling is one click, not two".

- Delete for any Task, Project, or Area, each behind a single global
  Yes/No confirmation dialog (`ConfirmContext`/`useConfirm()`) that states
  the specific consequence — "N projects will move to Unassigned," "N
  tasks will be unlinked" — computed from the actual count at delete time,
  not a generic "are you sure?". Yes is the default: autofocused, and
  Enter confirms regardless of which element has focus. Deletion cascades
  sideways only, never downward — deleting an Area unassigns (doesn't
  delete) its Projects; deleting a Project unlinks (doesn't delete) its
  Tasks.
- `TODO.md`: three more raised-but-deferred requests (editable task
  priority, project rename without opening the drawer, rapid multi-task
  capture scoped to a project) and the sort/filter-tasks gap.
- Hover-reveal rename + delete icons on the sidebar's project row
  (started as a same-day trial, additive to the project drawer's own
  controls). Resolves the "edit a project's name without opening its
  drawer first" request as a side effect. Extracted
  `useDeleteProjectCascade()` so the drawer and this row share one
  implementation of "unlink tasks, then delete the project" instead of
  duplicating it.
- Promoted hover-reveal to a settled, app-wide design principle: task
  rows and the project drawer's title now hide their rename/delete icons
  at rest too, same as the sidebar. Keyboard reachability verified even
  where a row has no preceding focusable sibling to hand focus off from
  (the drawer title) — see `design-principles.md`.
- The sidebar's "N in Someday" footer box now only renders once there's
  at least one Someday task — "0 in Someday" was permanent clutter that
  told the reader nothing. The trigger rule (any Someday task at all) is
  a placeholder; see the new "real review mechanism" TODO item below.
- Completed tasks are purged 24 hours after completion (not just marked —
  actually deleted), and each project's drawer keeps a running
  natural-language "Progress" narrative built from what got purged,
  compressing to a single running-total sentence once a day. Debug-only
  manual triggers (Ctrl+Alt+Shift+D, `scottejames@gmail.com` only)
  simulate both steps instantly for testing without waiting 24 hours. The
  narrative is template-generated text, not a real AI summary — see
  `design-principles.md` and the new "real AI-generated narrative" TODO
  item for the reasoning and the possible upgrade.
- `TODO.md`: a real review mechanism for forgotten tasks (explicitly not a
  priority yet), plus a possible future AI-generated narrative upgrade.

### Changed

- `TODO.md`'s "Delete" and "sidebar heading wrap" items moved to Shipped.

### Fixed

- Hiding the new sidebar rename/delete icons with `opacity: 0` still
  reserved their layout width, silently truncating the project name at
  rest — reintroducing the exact bug those icons exist despite (see
  "Move project reassignment out of the cramped sidebar tree row", above).
  Switched to `display: none` / `inline-block` so a hidden icon actually
  gives its space back.
- Testing the completed-task purge/narrative feature above with two tasks
  completed together surfaced three compounding race conditions, all now
  fixed: (1) `appendProjectNarrative`/`compressProjectNarrative` read
  `projects` from a stale render closure instead of the latest value, so a
  second call before a re-render landed silently overwrote the first
  instead of composing with it; (2) none of `ProjectStoreContext`'s or
  `TaskStoreContext`'s functions were memoized, so their identity churned
  on every render, which cascaded into the maintenance effect tearing down
  and re-running far more often than the intended "once on load, then
  every 5 minutes"; (3) `appendProjectNarrative` and
  `compressProjectNarrative` each fire an independent `Project.update`
  call, and with no ordering guarantee between two requests in flight for
  the same project, the append's could complete on the server after the
  compress's and silently revert the compression. Fixed via a
  synchronously-updated ref for reads inside those two functions,
  `useCallback` with stable deps on the functions the maintenance hook
  depends on, gating the automatic sweep on Amplify's `isSynced` signal
  instead of re-running on every data change, and awaiting the purge's
  narrative writes before compressing. Re-verified end-to-end (two tasks
  completed and purged together, a third completed later to trigger
  compression) with the raw DynamoDB record checked directly, not just the
  rendered UI.

## 2026-07-30

### Added

- Initial Horizon app: React 19 + TypeScript + Vite frontend on an AWS
  Amplify Gen2 backend (Cognito email/password auth, AppSync/DynamoDB for
  Task/Project/Program), implementing the time-horizon UI validated in the
  earlier interactive mockup — Today/Tomorrow/Next Week/Someday tabs, defer
  vs. schedule, deferred-task provenance, project short-code linking via a
  single free-text quick-add, and a project drawer. Deployed both a
  personal sandbox and a production environment (AWS Amplify Hosting,
  CI/CD from GitHub `main`).
- Areas of Responsibility tree in the sidebar: collapsible areas, an
  always-present Unassigned bucket, drag-and-drop to reassign a project
  between areas, and a "Move to area" control in the project drawer as the
  accessible/keyboard equivalent to dragging.
- App logo — four concentric rings, one per horizon color (Someday
  outermost through Today innermost/nearest) — in the header and as the
  browser favicon.
- Personal/Work commitment toggle in the header, filtering the whole app
  (sidebar, task lists, counts, quick-add defaults) by a `commitment`
  field now carried independently by every Task, Project, and Area.
  Quick-add recognizes `@work`/`@personal`; an unspecified commitment
  falls back to the linked project's, then the active tab, so it's rarely
  typed by hand.
- `TODO.md`: known UI gaps (rename/delete support, a touch drag-and-drop
  limitation, area-collapse persistence) and a set of feature ideas
  researched from Things 3, OmniFocus, Todoist, TickTick, Amazing Marvin,
  and Sunsama/Motion/Morgen.
- `design/design-principles.md` and `design/architecture-overview.md`,
  recording the UI and infrastructure decisions made this session as they
  were made, rather than leaving them to live only in conversation.
- Inline rename for any Task, Project, or Area: a pencil icon turns the
  label into a text box; Enter or clicking away saves, Escape reverts. All
  three share one hook (`useInlineRename`) rather than three copies of the
  same edit/commit/cancel logic. Placement follows available space — always
  visible on task rows and the project drawer, hover-revealed on the
  narrower sidebar area header, absent on the synthetic "Unassigned"
  bucket.
- `CHANGELOG.md` itself.

### Changed

- Renamed "Programs" to "Areas of Responsibility" end to end (DynamoDB
  table, schema, types, UI copy) — grouping is meant to be by head space
  (Home, Health, Work…), not an org hierarchy.
- Moved project reassignment out of the sidebar tree row entirely: a
  "Move ▾" button there left almost no width for the project name in the
  narrow column (a real screenshot showed "Kitchen Remodel" truncated to
  "C…"). It now lives in the project drawer, which has room for it, and
  the sidebar column widened 230px → 270px alongside the fix.

### Fixed

- Production build failures caused by Amplify Hosting's build container
  running an older npm than generated the local lockfile — `npm ci`'s
  strict lockfile-sync check rejected it. Switched `amplify.yml` to
  `npm install`, which isn't sensitive to that version skew.
