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
the only way out of Someday is an explicit "Schedule ▾" action the user takes
while reviewing the list. This is the inverse action of Defer (which pushes a
dated task out to a later horizon) rather than the same mechanism, and the UI
should keep using separate verbs/labels ("Defer" vs "Schedule") for the two
directions even though they're both "change this task's horizon" under the
hood — the label carries which direction the user is choosing.

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
area, or use its "Move ▾" menu), the same capture-now/organize-later split
the app already uses for tasks (quick-add now, triage into a horizon later).
Drag-and-drop is the fluid path; the "Move ▾" dropdown is the accessible
equivalent and the only path on touch/keyboard — don't let the drag
interaction become the sole way to reassign a project.
