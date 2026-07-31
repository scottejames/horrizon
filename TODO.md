# TODO

Backlog for Horizon. `Up next` and `Later` are product/UX; `Infrastructure`
is technical debt or platform limitations. When something ships, move it
into `Shipped` (checked) rather than deleting the line — see
`.claude/skills/update-project-artifacts/SKILL.md`.

## Up next

Raised reviewing a real screenshot of the Areas of Responsibility tree
(2026-07-30):

- [x] ~~Confirm the sidebar heading no longer wraps~~ — verified with a
      real Playwright screenshot on 2026-07-30: fits on one line at 270px.
- [ ] Persist each Area's collapsed/expanded state across sessions —
      currently everything re-expands on every reload.
- [ ] **Sort and filter tasks** within a horizon list. Today the sort order
      is fixed (open before deferred before done, then priority) with no
      user control, and there's no way to filter a list down — by project,
      priority, or a text search — other than the existing horizon/
      commitment split. Raised 2026-07-31; not being built yet.
- [ ] **Edit a task's priority** after it's created — priority can currently
      only be set at capture time via quick-add's `!high`/`!med`/`!low`;
      there's no way to change it on an existing task. Raised 2026-07-31;
      not being built yet.
- [ ] **Rapid multi-task capture scoped to a project** — from inside a
      project's drawer, add a run of tasks in quick succession that all
      default to Someday unless told otherwise (still honoring the usual
      `today`/`tomorrow`/`next week` overrides) — useful for brain-dumping
      everything for a project at once rather than one quick-add entry at a
      time. Raised 2026-07-31; not being built yet.
- [ ] **A real review mechanism, so tasks — Someday ones especially — don't
      get silently forgotten.** Right now nothing ever prompts you to
      revisit a Someday task; it just sits there indefinitely unless you
      happen to open that tab yourself. **Explicitly not a priority right
      now.** Related to the "Scheduled review cadence per Area/Project"
      idea below (OmniFocus's per-project review interval) — when this
      gets picked up, decide whether it's that general mechanism or
      something Someday-specific, rather than building both separately.
      Also related to the completed-task purge/narrative feature (see
      Shipped): that one already solves "don't lose the record of what
      happened" for *done* tasks — this one is the mirror problem for
      tasks that never got scheduled at all.
      Raised 2026-07-31.
      - The sidebar's "N in Someday" indicator (2026-07-31) currently uses
        the simplest possible stand-in rule for "needs review": it shows
        whenever there's at least one Someday task, with no concept of how
        long it's been sitting there or whether it's already been looked
        at. That rule is a placeholder, not a considered design — revisit
        it together with the real review mechanism above, not in
        isolation.

## Later — features worth considering (researched 2026-07-30)

Surveyed Things 3, OmniFocus, Todoist, TickTick, Amazing Marvin, and
Sunsama/Motion/Morgen (time-blocking tools). None of these are committed —
just candidates to weigh against Horizon's own design principles before
building.

- [ ] **Nested sub-areas** (Area → Sub-area → Project). Things 3 puts
      "Areas of Responsibility" at the top of its hierarchy the same way we
      now do — but if we want "Home - Finance" style grouping to be real
      structure instead of a naming hack, this is the fix.
- [ ] **Scheduled review cadence per Area/Project.** OmniFocus's standout
      GTD feature: you set a review interval (weekly, every 3 months...)
      and it surfaces due-for-review items in a dedicated view, instead of
      you having to remember. This is a natural extension of the Someday
      review we already have — could extend "review" to Areas/Projects
      generally, not just Someday tasks.
- [ ] **Natural-language date/time parsing** in quick-add — Todoist parses
      "tomorrow at 3pm" or "every Monday" directly out of free text. Ours
      currently only recognizes the four fixed horizon keywords; this would
      be a real upgrade to the same parser, not a new feature.
- [ ] **Recurring tasks** (daily/weekly/custom repeat rules) — TickTick and
      Todoist both have this; Horizon currently has no concept of a task
      that comes back. Directly relevant to a "things I want todo TODAY"
      app that will otherwise re-type the same task every day.
- [ ] **Tags/contexts, cross-cutting Project/Area** — classic GTD
      "contexts" (@calls, @errands) that TickTick and Amazing Marvin
      support as a second, independent dimension alongside Project — e.g.
      "everything I can do on the phone," regardless of which project or
      area it belongs to.
- [ ] **Subtasks/checklists within a task** — Todoist and TickTick both
      support this; useful once a Today task is bigger than one line item.
- [ ] **Kanban/board view per project** — of the GTD-focused apps, only
      Todoist has this; an alternative way to view one project's tasks
      instead of only via the horizon-tabbed list.
- [ ] **"Waiting For" list** — a standard GTD list type for tasks blocked
      on someone else, distinct from Someday (which is "no date yet," not
      "blocked on a person").
- [ ] **Saved filters / custom views** — OmniFocus's "Perspectives": e.g.
      "everything high-priority regardless of horizon," or "everything in
      one Area regardless of horizon" — cuts across the existing
      horizon-tab and area-tree navigation.
- [ ] **Start-of-day review ritual for carried-over tasks** — Sunsama's
      pattern: each day opens with a deliberate pass over yesterday's
      unfinished Today items, asking you to explicitly reschedule/defer
      each one rather than letting them silently roll forward.
- [ ] **Habit tracker** — TickTick's recurring daily check-off items,
      distinct from one-off tasks (a streak, not a to-do).
- [ ] **A real AI-generated project narrative**, replacing the
      template-based one shipped 2026-07-31 (see Shipped). Would need a
      Lambda + secret (the same shape as the `ai-assist` pattern
      `CODING_GUIDELINES.md` references from an earlier project), called
      with the batch of just-completed task descriptions, to write an
      actual generated summary instead of a fixed sentence template. Bigger
      lift than the feature justified for a first pass; revisit if the
      template version feels too mechanical in practice.

## Infrastructure

- [ ] Drag-and-drop project reassignment doesn't work on touch devices
      (plain HTML5 DnD has no touch backend) — the project drawer's "Move
      to area" control is the only touch-compatible path today. Matters if
      Horizon is ever used on a phone/tablet.
- [ ] Production JS bundle is ~910KB (mostly `aws-amplify` +
      `@aws-amplify/ui-react`) — Vite already flags this. Not a problem
      yet; revisit with code-splitting if load time becomes noticeable.

## Shipped

- [x] Logo mark — four concentric rings, one per horizon (Someday
      outermost, Today innermost/nearest), reusing the exact colors already
      used for horizon tabs/dots/chips. Live-themed via CSS `var()` in the
      header (`src/components/Logo.tsx`); a static hex version with a
      `prefers-color-scheme` media query for the browser-tab favicon
      (`public/favicon.svg`), since a favicon can't see the app's own CSS.
- [x] Personal/Work commitment toggle — filters the whole app; see
      `design-principles.md`'s "Personal/Work is a second, independent
      filter" entry.
- [x] Rename an Area, Project, or Task — pencil icon turns the label into a
      text box; Enter or clicking away saves, Escape reverts. Doesn't
      address the underlying "Home - Finance" naming-as-hierarchy workaround
      (the nested sub-areas idea above still stands) — it only fixes typos
      and outdated names, not the lack of real sub-structure.
- [x] Delete an Area, Project, or Task, each behind a Yes/No confirmation
      that states the specific consequence (project/task counts affected).
      Deleting an Area unassigns its Projects; deleting a Project unlinks
      its Tasks. Neither cascades further — Tasks and Projects are never
      deleted just because their parent was.
- [x] ~~Edit a project's name without opening its drawer first~~ — resolved
      as a side effect of the hover-reveal experiment below: rename now
      lives directly on the sidebar tree row too.
- [x] Hover-reveal rename/delete icons rolled out to the whole app (settled
      design principle, not just the sidebar trial it started as) — task
      rows, the project drawer's title, the sidebar's area header, and the
      sidebar's project row all hide their edit/delete icons until the
      mouse (or keyboard focus) is on that specific item. Verified keyboard
      reachability holds even where a row has no preceding focusable
      sibling (the project drawer's title) via a wider focus scope on
      `.project-drawer` itself. See design-principles.md.
- [x] Completed tasks are purged 24h after completion; each project's
      drawer keeps a running natural-language "Progress" narrative built
      from what got purged, compressing to a single running-total sentence
      once a day so it doesn't grow forever. Debug-only manual triggers
      (Ctrl+Alt+Shift+D, `scottejames@gmail.com` only) simulate both steps
      instantly for testing. See design-principles.md's "Completed tasks
      fade into a project's narrative, then get purged" entry — including
      two real limitations worth remembering: the narrative is
      template-generated text, not a real AI summary (see the Later
      section below), and the 24h cycle only runs while the app is open
      (client-side interval, no scheduled backend job).
