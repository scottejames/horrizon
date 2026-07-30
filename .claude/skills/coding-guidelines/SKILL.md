---
name: coding-guidelines
description: Use this whenever writing, generating, or editing code in this project (React 19 + TypeScript + Vite frontend, AWS Amplify Gen2 backend under amplify/, or Vitest/RTL/Playwright tests) — before writing the first line, and again before handing the change back. Read CODING_GUIDELINES.md at the project root and hold new/edited code to it: general simplicity principles (smallest thing that solves the problem, comments explain why not what, DRY-by-knowledge, YAGNI), SOLID adapted to functional TS/React, React/TS conventions (strict mode, hooks rules, optimistic updates, double-submit guards, ARIA roles), Context/state-management rules, Amplify Gen2 backend rules (authorization, authMode, secrets, ids), testing conventions, error handling, and security rules (no dangerouslySetInnerHTML, no frontend secrets, untrusted-input handling). Skip only for genuinely non-code edits (prose-only docs, pure formatting/whitespace).
---

# Apply this project's coding guidelines

`CODING_GUIDELINES.md` at the project root is the normative, prescriptive rulebook
for code in this repo — distinct from `designs/design-principles.md`, which is
retrospective. It is a living document: re-read it each time rather than relying on
a summary from an earlier conversation, since it changes as new patterns get
established.

## When to apply this

Any time you're about to write new code or edit existing code in this project —
frontend (`src/`), Amplify backend (`amplify/data`, `amplify/auth`,
`amplify/functions`), or tests. Not needed for pure prose edits to docs like
`README.md`/`CHANGELOG.md` (those are covered by the `update-project-artifacts`
skill instead) or whitespace-only changes.

## How to apply it

1. **Before writing code**, read `CODING_GUIDELINES.md` in full (or the sections
   relevant to what you're touching — e.g. section 5 for any Amplify schema change,
   section 6 for any test file). Don't work from memory of a previous read in this
   conversation if meaningful time/edits have passed — check it's still current.
2. **While writing**, actively check against the checklist below rather than
   treating it as background reading.
3. **Before handing the change back**, re-scan the diff against the same checklist
   — it's easy to satisfy these rules in the first file touched and drift in the
   second.
4. **If a rule and the task conflict** (e.g. the task seems to need a class
   component, or a generic plugin system), say so explicitly rather than silently
   picking one side — the guidelines take precedence unless the user overrides them
   for this specific change.
5. **If you establish a genuinely new pattern**, or find an existing rule wrong in
   practice, update `CODING_GUIDELINES.md` in the same change (per its own "Keeping
   this useful" section) instead of letting the lesson evaporate.

## Checklist (see CODING_GUIDELINES.md for full detail + examples)

- **Simplicity**: smallest thing that solves the *named* problem — no speculative
  config, no abstraction for a second use case that doesn't exist yet.
- **Comments**: explain *why*, never *what*.
- **DRY**: only unify code that changes for the *same* reason; don't merge
  coincidentally-similar code that changes for different reasons.
- **SOLID (functional)**: one reason to change per function/hook/component; extend
  via the existing registry/pattern rather than editing unrelated call sites; a
  shared shape (e.g. `ToolDefinition`) must be usable interchangeably everywhere
  it's expected; depend on the narrowest shape, not a fat one; depend on a
  hook/context abstraction, never call `generateClient()`/`fetch` directly from a
  component.
- **React/TS**: strict mode as-is (don't relax `noUnusedLocals` etc.); function
  components + hooks only; explicit prop/state types including
  `null`/`undefined`; hooks only at top level; `Set`/`Map` lookup over `.find()` in
  a loop for repeated membership checks; optimistic-update-then-reconcile for
  network-backed writes; a `useRef` (flipped synchronously as the first line of the
  handler) to guard double-submission, not state/`disabled` alone; the ARIA role
  that matches actual behavior (don't reach for `tablist`/`tab` for a plain filter
  toggle group).
- **State/Context**: one job per context; mount persistent providers once at the
  app root; memoize a context value only when re-renders are frequent and identity
  matters; split state by *reason to change*, even across logically-related
  concerns; every `useX()` hook throws when used outside its provider, never
  returns `null` silently.
- **Amplify Gen2**: deny-by-default with the most specific `.authorization(...)`
  winning; explicit `authMode` on any client call against an owner-scoped model;
  secrets stay server-side in Lambda env only, never a frontend env var; plain
  string field over a GraphQL enum for values that might evolve; client-generated
  `crypto.randomUUID()` id set explicitly on `create()`; plain field (not
  `belongsTo`/`hasMany`) for a relation that doesn't need referential integrity.
- **Testing**: query by role/label/text, not CSS class or test-only id; compose the
  real providers, mock only the network/auth edges; add a regression test for any
  race-condition guard, not just the happy path; reproduce cross-mount bugs with an
  actual mount/unmount + `rerender()` in one shared tree; verify AI-tool output
  parsing against intercepted Playwright network responses.
- **Error handling**: fire-and-forget backend writes get `.catch(console.error)`;
  user-initiated actions that can fail get a real UI error state; no empty
  `catch {}` without a comment justifying the swallow; validate at the boundary
  only, trust internal callers past it.
- **Security**: never `dangerouslySetInnerHTML`, ever; no secret/token/credential in
  frontend code, committed files, or build-time env vars; treat all external input
  (AI output, `localStorage`, URL params) as untrusted and parse defensively.
