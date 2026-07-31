# Design principles

Decisions confirmed while reviewing the first UI mockup (2026-07-30, see the
"Horizon" interactive mockup shared in that conversation). These are settled
calls, not open questions — build against them rather than re-litigating in a
future change, unless a real usage problem contradicts one.

## Color is spent on time-horizon only

Today / Tomorrow / Next Week / Someday each get one fixed hue (warm amber,
teal, slate-blue, mauve). No other dimension of the UI is allowed to introduce
a new color family — that's the one categorical color scale the app gets, and
it needs to stay legible on sight without competing with anything else.

## Priority is shape, not color

Priority (high/med/low) is a three-bar signal icon (1, 2, or 3 bars filled),
rendered in ink/neutral tones only. It was tempting to give priority its own
color scale too, but that would fight the horizon colors for attention and
make "what does this color mean" ambiguous. If a task needs to visually
scream for attention, that's a signal the model needs a real "overdue" state,
not a louder priority color.

## A deferred task carries where it came from

Deferring a task (Today/Tomorrow/Next Week → any other horizon) doesn't just
move it — the moved task keeps a small "deferred from {horizon}" tag wherever
it lands, distinct from a task natively scheduled there. This is deliberate:
it's a light signal for noticing your own procrastination patterns (the same
task keeps sliding), and it's cheap to compute since we already track the
task's previous horizon at move-time. Don't drop this to simplify the move
logic later — it's the whole point of `DEFERRED` being a distinct state from
just "open, but on a different day."

## Someday → scheduled is one-way and manual, never automatic

Someday tasks never get swept onto a dated list by any background process —
the only way out of Someday is an explicit reschedule action the user takes
while reviewing the list. This is the inverse action of Defer (which pushes a
dated task out to a later horizon) rather than the same mechanism, and the UI
should keep using separate verbs ("Defer" vs "Schedule", in each button's
`title`/`aria-label` — see the one-click reschedule entry below) for the two
directions even though they're both "change this task's horizon" under the
hood — the verb carries which direction the user is choosing.

## Project detail opens as a drawer, not a page

Clicking a project's short code (in the sidebar or on a task's chip) slides in
an overlay listing every todo linked to that project, rather than navigating
away. The active horizon list underneath must never be lost or reset by
opening a project — projects are a lens on todos, not a separate section of
the app.

## Quick-add is one free-text field, parsed inline

Priority (`!high`/`!med`/`!low`), project (`#code`), and schedule
(`today`/`tomorrow`/`next week`/`someday`) are all extracted from the same
single input rather than split into separate form fields — capture speed
matters more than structured input here. An unrecognized `#code` is still
accepted and chipped (labeled "project (new)") instead of rejected; the parser
should never block on a project it doesn't already know about, since a new
project may legitimately not exist in the sidebar yet.

## Programs are "Areas of Responsibility"; grouping is by head space, not org chart

Revisited 2026-07-30, after the first Programs/Projects sidebar shipped and
turned out to be actively annoying to use — every program rendered its own
permanently-visible "add project" text box, so the sidebar was mostly empty
input fields. Renamed the concept from "Program" (a vague, faintly corporate
word for a grouping) to **Area of Responsibility** — a standing area of your
life or work (Home, Health, Work, Finances…) you group projects under by
which head space they belong to, not by any formal hierarchy. This is a
naming and grouping-criterion change, not just a label swap: it changes what
question you ask when deciding where a project belongs ("what head space is
this?" rather than "what program owns this?").

## Areas/Projects are a tree; capture and organize are separate steps

The sidebar is a collapsible tree — Areas of Responsibility as expandable
nodes, Projects nested under them, plus an always-present "Unassigned"
bucket — rather than a flat list with one add-form wired to each area. There
is exactly one "+" control for a new area and one for a new project, both
hidden until clicked; a newly-created project always lands in Unassigned.
Organizing it into an area is a deliberate second step (drag the row onto an
area, or open the project's drawer and use its "Move to area" control), the
same capture-now/organize-later split the app already uses for tasks
(quick-add now, triage into a horizon later). Drag-and-drop is the fluid
path; the drawer's dropdown is the accessible equivalent and the only path
on touch/keyboard — don't let the drag interaction become the sole way to
reassign a project.

**Revised 2026-07-30, same day**: the "Move ▾" control originally lived on
the tree row itself, but the sidebar column is narrow (see a real screenshot
of it in this session) and a per-row button left almost no width for the
project name — "Kitchen Remodel" was rendering as "C…". Moved it into the
project's drawer instead, where there's room, and widened the sidebar column
(230px → 270px) as a companion fix. The tree row itself now shows only a
drag handle, code, name, and open-task count — drag-and-drop is the only
in-tree move affordance; the drawer is the only place to reassign it without
dragging. If a future change adds a row-level control back, budget its width
against the name column first, not after.

## Personal/Work is a second, independent filter — not a new color

Added 2026-07-30. Every Task, Project, and AreaOfResponsibility carries its
own `commitment: 'personal' | 'work'` field, and a header toggle switches
which one the whole app (sidebar tree, horizon tabs and lists, counts, quick-
add defaults) is currently showing. A few decisions worth keeping intact:

- **Independent, not inherited.** A Task's commitment isn't derived from its
  Project, nor a Project's from its Area — each is its own field. This
  mirrors how the user asked for it ("each area, project, task should be
  linked to ONE of personal or work"), and keeps the data model simple
  (no cascading recompute when a project moves areas). The cost is that
  it's *possible* to create an inconsistent tree (a work project sitting in
  a personal area) — see the mitigation below.
- **Defaults resolve, so it's rarely typed by hand.** Quick-add resolves a
  task's commitment in this order: an explicit `@work`/`@personal` in the
  text, then the commitment of whatever `#project` it's linked to, then
  whichever tab is currently active. New Areas/Projects created from the
  sidebar's "+" controls default to the active tab. Typing `@work`/`@personal`
  is the escape hatch for the exception, not the common path.
- **The toggle is neutral.** Two buttons, ink/border tones only — see "Color
  is spent on time-horizon only" above. This is a second filter dimension,
  not a third color family; don't give Personal/Work their own hue.
- **The drawer's "Move to area" only offers same-commitment areas.** Since
  the sidebar tree only ever shows one commitment's areas and projects at
  once, dragging can't create a cross-commitment area/project mismatch —
  but the drawer's move menu is a separate code path (not filtered by the
  active tab), so it filters explicitly by `project.commitment` to close the
  same loophole there. If another way to reassign a project's area gets
  added later, it needs the same guard.

## Renaming is inline, pencil-triggered, and width-aware

Added 2026-07-30. Every Task description, Project name, and Area name can
be renamed the same way: a pencil button turns the label into a text box;
Enter saves, Escape reverts, and clicking away also saves (not just Enter)
since losing an edit by clicking elsewhere is a worse default than saving
one extra time. The three call sites share one hook
(`useInlineRename`) rather than three copies of the same
edit/commit/cancel state machine — genuinely the same interaction, not
just similar-looking code (CODING_GUIDELINES.md's DRY-by-knowledge test).

- **Where the pencil lives depends on available width**, learned the hard
  way from the sidebar tree row's earlier "Move ▾" truncation bug. Task
  rows and the project drawer are roomy, so the pencil is always visible.
  The area header in the sidebar tree is not, so its pencil only appears on
  row hover/focus (`opacity: 0` by default) rather than competing with the
  name for space permanently. The synthetic "Unassigned" bucket has no
  pencil at all — it isn't a real Area row to rename.
- **The ref never lives inside the hook's returned object.** `eslint-plugin-
  react-hooks`'s `react-hooks/refs` rule flags *any* field read off an
  object during render if that object also happens to carry a ref
  anywhere in it — not just reads of the ref itself. `useInlineRename`
  takes the caller's ref as an argument instead of returning one, so its
  return value (`draft`, `commit`, `startEditing`, …) is plain state and
  functions the rule leaves alone. Don't "simplify" this by bundling the
  ref back into the return value — it reintroduces the lint error at every
  call site.
- **The project drawer's title editor is remounted (`key={project.id}`)
  when the drawer switches projects.** The drawer itself is one long-lived
  component instance reused for whichever project is open, so without a
  fresh key, mid-edit state (or even just a stale `draft`) from the
  previous project could leak into the next one. Task rows and area
  sections don't need this: they're already list items keyed by their own
  entity's id, so a different entity never reuses another's component
  instance in the first place.

## Deletion cascades sideways, never downward, and is always confirmed

Added 2026-07-31. Deleting an Area unassigns its Projects (they move to
Unassigned); deleting a Project unlinks its Tasks (`projectId` cleared).
Neither cascades further down to delete the child records themselves — a
Task never disappears because a Project did, and a Project never disappears
because an Area did. This was specified directly, not inferred, and it's
the reason `deleteProject`/`deleteArea` live in `ProjectStoreContext` while
the *unlinking of tasks* is a separate call
(`TaskStoreContext.unlinkTasksFromProject`) composed at the component that
triggers the delete (`ProjectDrawer`), not something `ProjectStoreContext`
reaches across into `TaskStoreContext` to do itself — contexts don't call
into each other; components compose them (CODING_GUIDELINES.md #4).

- **Every deletion is confirmed with a message that states the specific
  consequence**, not a generic "are you sure?" — "3 projects will move to
  Unassigned," "2 tasks will be unlinked," computed from the actual count
  at delete time, falling back to "there's nothing linked to it" when the
  count is zero. Explaining the blast radius is the point; a generic
  confirmation would be no better than not asking.
- **Yes really is the default**, on purpose, against the usual "make Cancel
  the safe default for destructive actions" convention — this was an
  explicit instruction: Yes is autofocused, and Enter confirms regardless
  of which element in the dialog has focus. Don't "fix" this toward the
  more common pattern later without checking first; it was a deliberate
  choice for this tool, not an oversight.
- **One global `ConfirmProvider`/`useConfirm()`**, not a dialog owned by
  each delete button. The alternative (each of Task/Project/Area owning its
  own confirm modal markup) is the same duplication `useInlineRename` was
  built to avoid, for the same reason — genuinely one interaction, reused.
- **Danger red is a semantic exception to "color is spent on time-horizon
  only."** `--danger` exists solely for the confirm dialog's Yes button and
  the delete icon's hover state — it's a severity signal, not a fourth
  member of the categorical horizon scale, the same distinction the
  frontend design guidance draws between semantic (good/warning/critical)
  color and a brand's categorical accent. Don't reach for `--danger`
  outside an actual destructive-action context.

## Edit/delete icons only show on hover of the item they act on

Settled 2026-07-31, promoted from a same-day trial on the sidebar's
project row after it held up: **every** rename/delete icon in the app —
task rows, the project drawer's title, the sidebar's area header, the
sidebar's project row — is hidden at rest and appears only while the
mouse is over the specific item it acts on (or that item has keyboard
focus). Nothing here is always-visible anymore; the drawer's earlier
"always show rename/delete" behavior from the "Renaming is inline..." and
"Deletion cascades sideways..." entries above is superseded by this one.

- **`display: none`, never `opacity: 0`, for the hidden state.** Opacity
  still reserves the icon's layout box, which silently reintroduces
  truncation at rest — a real bug caught while building this on the
  sidebar project row (the label rendered as "Grocer…" even though nothing
  was visibly there). `display: none` actually returns the width to the
  label, which is the entire point.
- **Hover scope is the item's own row or title**, not some larger
  container — `.task:hover`, `.tree-project:hover`, `.tree-area-header`'s
  own hover, `.drawer-title-row:hover`. Icons appearing because the mouse
  is merely near the item, not on it, would defeat the "only when the
  mouse is on the item in question" point of this pattern.
- **Focus scope can be wider than hover scope when an item has no
  preceding focusable sibling to hand off from.** Most rows have one — a
  checkbox or toggle button always sits before the icons in DOM order, so
  tabbing onto it satisfies that row's own `:focus-within` and makes the
  icons reachable for the next Tab press. The project drawer's title has
  no such sibling (`h2` isn't focusable), so its focus trigger is scoped to
  the whole `.project-drawer` instead of just `.drawer-title-row` — the
  drawer already autofocuses its close button on open, which makes
  `:focus-within` true immediately and keeps the icons keyboard-reachable
  without widening the *hover* trigger past the title itself. Don't "fix"
  this asymmetry between hover-scope and focus-scope without checking
  reachability first — it exists on purpose.
- **This is now the pattern for any future edit/delete icon**, not a
  per-component choice to relitigate. If a new context has no preceding
  focusable sibling for the icons to hand off from, solve it the same way
  the drawer did (widen the focus scope, or autofocus something), not by
  making that one icon always-visible.

## The sidebar's Someday indicator only exists when there's something to review

Added 2026-07-31. The "N in Someday" footer box (and its `→` shortcut into
the Someday tab) doesn't render at all when the count is zero — "0 in
Someday" told the reader nothing they didn't already know, and a
permanently-present box just to occasionally show a real number is worse
than a box that only shows up when it means something.

The trigger rule is deliberately the simplest possible one for now: any
Someday task at all. This is a **placeholder**, not a considered stance —
see `TODO.md`'s "a real review mechanism" entry, which is explicitly not a
current priority but is where this rule should be reconsidered once it is
(e.g. age-based, or tied to an actual review cadence rather than mere
presence). Don't read the current rule as settled the way the rest of this
document's entries are.

## Completed tasks fade into a project's narrative, then get purged

Added 2026-07-31. A done task stays visible (struck through) same as
always, but after 24 hours it's actually deleted — not archived, not
hidden, gone — and if it belonged to a project, its description is folded
into that project's narrative first so it isn't lost. The narrative itself
compresses once a day so it doesn't grow without bound: all but the most
recent entry collapses into a single running-total sentence
(`compressNarrative` in `src/lib/narrative.ts`), while `completedTaskCount`
on the Project keeps the true cumulative total alive across compressions
even though the per-task detail behind it is gone.

- **The narrative is template-generated, not a real AI summary.** "Natural
  language" here means readable template sentences (`describeCompletedBatch`
  building `"31 Jul: wrapped up \"X\" and \"Y\"."`), not an LLM call. A
  real generated summary would need a new Lambda + secret (the same shape
  as the `ai-assist` pattern this project's own `CODING_GUIDELINES.md`
  references from elsewhere) — a bigger lift than this feature warranted
  for a first pass. See `TODO.md` for that as a possible future upgrade,
  not a compromise to quietly "fix" later without discussion.
- **The 24-hour timers are client-side only.** There's no scheduled Lambda
  or cron — `useNarrativeMaintenance` checks every 5 minutes while the app
  is open, plus once as soon as the initial `Task`/`Project` data is
  actually loaded (gated on Amplify's `isSynced` flag, not just "on
  mount" — see below), and purges/compresses whatever is actually due at
  that moment. If the app isn't open, nothing happens until it next is.
  This is a real limitation, not just an implementation detail — if
  reliable same-day purging ever matters, that needs an actual scheduled
  backend job, not a tighter client-side interval.
- **The automatic sweep deliberately does NOT re-run on every tasks/projects
  change — only on load and the 5-minute interval.** An earlier version
  re-triggered on every data change to make sure it caught the initial load;
  that instead let two purge passes each act on a different partial view of
  "what's a candidate" as `observeQuery` emissions streamed in, corrupting
  the narrative. If a future change needs tighter reactivity, don't
  reintroduce a `[tasks, projects]` dependency on the trigger effect —
  find another way to detect "meaningfully new data," the way `tasksReady`/
  `projectsReady` (from `isSynced`) do for the initial load.
- **Two independent `Project.update` calls for the same project race with no
  ordering guarantee.** `appendProjectNarrative` and
  `compressProjectNarrative` each fire their own backend write; if both
  happen close together for the same project (as the automatic sweep does
  when a purge's new entry immediately makes compression due), whichever
  request reaches DynamoDB last wins the `narrative` field, even if the
  other's local state was already correct. The sweep now `await`s the
  purge's writes before compressing. Same caution applies to any future
  code that fires two writes to the same record close together — reads via
  `projectsRef`/`getLatestProjects` fix a stale-read bug, but they don't fix
  an out-of-order-write bug, which needs actual sequencing.
- **Purging is global; the narrative is project-only.** Any completed task
  24h old gets deleted, project-linked or not — but only project-linked
  ones produce a narrative entry, since there's nowhere to put one
  otherwise. Don't extend the narrative concept to unassigned tasks without
  first deciding where that narrative would even live.
- **Debug mode is a convenience gate, not a security boundary.** It's
  scoped to one account (`scottejames@gmail.com`, checked via
  `user.signInDetails.loginId`) and has to be explicitly entered even for
  that account — off by default, toggled per-session with
  Ctrl+Alt+Shift+D (not Ctrl+Shift+D, which Chrome already binds to
  "bookmark all tabs"). But every debug action only ever operates on that
  signed-in user's own owner-scoped data regardless — the gate exists so a
  different signed-in user never even sees testing controls in their own
  UI, not because the underlying actions would be unsafe for them to run
  otherwise. Checked twice on purpose (once in `App.tsx` before the prop is
  even passed down, again inside `ProjectDrawer` itself) — don't remove
  either check as "redundant."

## Sort mode is secondary to the open/deferred/done grouping, never a replacement for it

Added 2026-07-31. The horizon list's sort/filter controls (`src/lib/
taskListView.ts`) let you choose Priority, Alphabetical, or Project
ordering — but whichever mode is active, a done task never sorts above an
open one, and a deferred task never sorts above an open one either.
`sortTasks` always applies `stateRank` first and only lets the chosen mode
break ties within a state group. If a future sort mode is added, keep this
— a to-do list where "done" can outrank "still to do" defeats the point of
the list, however the tasks within each group happen to be ordered.

## The project drawer's rapid-add defaults differently than the main capture bar, on purpose

Added 2026-07-31. `CaptureBar` defaults an unscheduled task to Today —
matching the app's core premise, an app for things you want to do today.
`ProjectRapidCapture` (inside the project drawer) instead defaults to
Someday, because its use case is different: brain-dumping everything a
project might ever need, not committing to doing all of it today. Both
still honor an explicit `today`/`tomorrow`/`next week`/`someday` keyword
the same way. This needed `parseQuickAdd` to expose `horizonExplicit`
(false when `horizon` is only the "today" fallback) rather than baking one
default into the parser — don't remove that field to "simplify" the
parser; it's what lets two different callers pick two different sensible
defaults from the same parsing logic.

## Rescheduling is one click, not two

Added 2026-07-31, replacing the "Defer ▾"/"Schedule ▾" dropdown that
shipped 2026-07-30. That dropdown took two clicks (open it, then pick a
target) for what's one of the most frequent actions in the app — moving a
task to a different horizon. Every task row now shows the other three
horizons as always-visible, color-coded one-click buttons
(`HORIZON_ORDER.filter((h) => h !== task.horizon)`, so it's always exactly
the three horizons the task *isn't* currently on, in a fixed order) instead
of a menu that has to be opened first. The colors reuse the same
`--accent`/`--tomorrow`/`--week`/`--someday` tokens as the horizon tabs and
`.horizon-dot`, not a new palette — so a task row's reschedule buttons read
as "the same four horizons" the rest of the app already color-codes, not a
new visual language to learn. Labels are abbreviated (`Tdy`/`Tmrw`/`Wk` —
see `HORIZON_SHORT_LABEL` in `lib/horizon.ts`) to fit three buttons in the
same row that used to hold one dropdown button; the full word is still in
each button's `title`/`aria-label` for anyone who needs it spelled out.
Someday is the one exception, spelled out in full rather than abbreviated
(feedback 2026-07-31: "Sd" read as a typo, not a word, unlike the other
three which still visibly derive from their full word) — it costs little
width since a task's own horizon is never one of its own reschedule
targets, so "Someday" appears at most once per row. If a future change
adds a fifth horizon, revisit this — four buttons might
still fit, but don't let it grow unbounded before checking.
