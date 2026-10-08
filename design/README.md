# Design docs

Indexes the standing design decisions for this project. `design-principles.md`
holds the decisions themselves — what we decided and why, updated with what
actually happened rather than left to live only in a conversation.

| Document | Covers |
| --- | --- |
| [design-principles.md](design-principles.md) | Todo-list UI decisions: time-horizon color, priority signal, deferred provenance, project drawer, quick-add parsing |
| [../public/help.html](../public/help.html) | User-facing help, served in the app at `/help.html` (Help link in the header). Describes current behavior in plain language — kept in step with this folder by `.claude/skills/update-project-artifacts` |
| [architecture-overview.md](architecture-overview.md) | Backend infra: Amplify Gen2 stack, Cognito auth, AppSync/DynamoDB data model, sandbox vs. production environments, CI/CD via Amplify Hosting |
