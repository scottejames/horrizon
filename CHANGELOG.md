# Changelog

Notable changes to Horizon, newest first. See
`.claude/skills/update-project-artifacts/SKILL.md` for how this file is
kept current.

## 2026-07-31

### Added

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

### Changed

- `TODO.md`'s "Delete" and "sidebar heading wrap" items moved to Shipped.

### Fixed

- Hiding the new sidebar rename/delete icons with `opacity: 0` still
  reserved their layout width, silently truncating the project name at
  rest — reintroducing the exact bug those icons exist despite (see
  "Move project reassignment out of the cramped sidebar tree row", above).
  Switched to `display: none` / `inline-block` so a hidden icon actually
  gives its space back.

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
