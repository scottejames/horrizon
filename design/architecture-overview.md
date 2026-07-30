# Architecture overview

What's actually provisioned, and why it's shaped this way. Update this
alongside any change to the stack, auth model, data model, or deployment
setup — a stale architecture doc actively misleads instead of just being
silent (same standard as `design-principles.md`).

## Stack

React 19 + TypeScript + Vite frontend, backed by an AWS Amplify Gen2 backend
(`amplify/auth`, `amplify/data`) — CDK under the hood, not the older
classic Amplify CLI. Chosen because it's the stack `CODING_GUIDELINES.md`
already commits to, and because Gen2's `defineAuth`/`defineData` gives typed,
version-controlled infrastructure instead of console clicking.

## Auth: Cognito

`amplify/auth/resource.ts` defines a Cognito user pool with email + password
as the only sign-in method (`loginWith: { email: true }`). No social
providers, no MFA — this is a single-user planning tool, not a multi-tenant
product, so the simplest sign-in that still gives each person their own
account was enough for V0.

## Data: AppSync + DynamoDB

`amplify/data/resource.ts` defines three models — `Task`, `Project`,
`Program` — each backed by its own DynamoDB table via AppSync, each with its
own explicit `allow.owner()` authorization rule (deny-by-default; see
`CODING_GUIDELINES.md` #5). `priority`, `horizon`, and `state` are plain
strings rather than GraphQL enums, and `Task.projectId` /
`Project.programId` are plain optional string fields rather than
`belongsTo`/`hasMany` relations — both per the same section of the coding
guidelines, and both already covered there with this exact schema in mind.

The frontend never calls `generateClient()` with an implicit auth mode —
`src/lib/dataClient.ts` sets `authMode: "userPool"` explicitly, since the
schema's default auth mode doesn't automatically apply to every model's own
rule (see that file's comment, and `CODING_GUIDELINES.md` #5).

## Two separate environments

There are two independent copies of the entire backend (separate Cognito
pools, separate AppSync APIs, separate DynamoDB tables) — deleting one has
no effect on the other:

- **Sandbox** — a personal dev backend on this machine, created by
  `npx ampx sandbox` (or `npm run sandbox`). CloudFormation stacks prefixed
  `amplify-horizon-scottejames-sandbox-*`. Meant for local iteration only;
  tear down with `npx ampx sandbox delete` when it's no longer needed.
- **Production** — deployed by AWS Amplify Hosting, CloudFormation stacks
  prefixed `amplify-d1gqsdonocn2dq-main-branch-*`. This is the one real
  users' data lives in.

Region for both: `eu-west-2`.

## CI/CD: Amplify Hosting

The Amplify Hosting app (`appId d1gqsdonocn2dq`, default domain
`d1gqsdonocn2dq.amplifyapp.com`) is connected to `scottejames/horrizon` on
GitHub via a webhook Amplify created directly (no manual GitHub App install
needed — `aws amplify create-app` accepted a personal access token via
`--access-token`). Every push to `main` triggers a build defined by
`amplify.yml` at the repo root:

- **Backend phase**: `npm install`, then
  `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID` — this
  is what deploys the CDK-defined auth/data stacks to the prod environment.
- **Frontend phase**: `npm install`, `npm run build`, artifacts from `dist`.

Amplify assumes `amplify-horizon-prod-service-role` (IAM) to run the backend
deploy, scoped to the `AmplifyBackendDeployFullAccess` managed policy — the
policy purpose-built for CDK-based Gen2 deploys (it assumes the account's
existing `cdk-bootstrap` roles rather than granting broad resource-creation
permissions directly). This is deliberately narrower than the older
`AdministratorAccess-Amplify` policy, which exists for classic
(non-CDK) Amplify projects and isn't needed here.

**Incident**: the first two production builds failed with `npm ci`
reporting the lockfile "out of sync," even though it installed cleanly
locally. Cause: Amplify's build container runs an older npm (10.9.3) than
generated the committed lockfile locally (11.8.0), and `npm ci`'s
cross-version lockfile validation is strict enough to reject that skew.
Setting the documented `AMPLIFY_NODE_VERSION` app env var didn't help — the
Gen2 "Backend Build" sub-phase doesn't appear to honor it. Fix: `amplify.yml`
uses `npm install` instead of `npm ci` in both phases, which isn't sensitive
to that mismatch. If a future change reintroduces `npm ci` here, expect this
same failure unless the local and Amplify npm versions are pinned to match.

## Cost / teardown notes

Both environments are real, billable AWS resources that persist until
explicitly torn down — neither expires on its own. Production specifically:
delete via `aws amplify delete-app --app-id d1gqsdonocn2dq` for the Hosting
app, **and separately** delete the `amplify-d1gqsdonocn2dq-main-branch-*`
CloudFormation stacks, or user data and the Cognito pool will keep sitting
around (and billing) after the Hosting app itself is gone.
