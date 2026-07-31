import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Task/Project/AreaOfResponsibility schema, backed by DynamoDB via AppSync.
 *
 * `priority`, `horizon`, `state`, and `commitment` are plain strings rather
 * than GraphQL enums: their accepted values are expected to evolve (see
 * CODING_GUIDELINES.md #5), and an enum member can't be renamed without a
 * breaking schema change.
 *
 * `commitment` ('personal' | 'work') is set independently on every Task,
 * Project, and AreaOfResponsibility rather than only on Area and inherited
 * — see design/design-principles.md's "Personal/Work is a second,
 * independent filter" entry for why, and how the app still defaults it
 * sensibly at creation time so this rarely needs to be typed by hand.
 *
 * `Task.projectId` / `Project.areaId` are plain optional string fields, not
 * `belongsTo`/`hasMany` relations — detaching a project from an area, or a
 * task from a project, is ordinary application logic (including moving a
 * project to a different area), not a cascade delete a relation's own
 * policy would otherwise impose.
 */
const schema = a.schema({
  Task: a
    .model({
      description: a.string().required(),
      priority: a.string().required(), // 'high' | 'med' | 'low'
      horizon: a.string().required(), // 'today' | 'tomorrow' | 'week' | 'someday'
      state: a.string().required(), // 'open' | 'done' | 'deferred'
      commitment: a.string().required(), // 'personal' | 'work'
      deferredFrom: a.string(), // horizon this task was deferred from, set only while state === 'deferred'
      projectId: a.string(),
      completedAt: a.datetime(), // set when state becomes 'done', cleared if un-done; drives the 24h purge
    })
    .authorization((allow) => [allow.owner()]),

  Project: a
    .model({
      shortCode: a.string().required(),
      name: a.string().required(),
      commitment: a.string().required(), // 'personal' | 'work'
      areaId: a.string(),
      narrative: a.string(), // rolling natural-language progress summary, see design-principles.md
      completedTaskCount: a.integer(), // cumulative total, survives narrative compression and task purges
      narrativeCompressedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  AreaOfResponsibility: a
    .model({
      name: a.string().required(),
      commitment: a.string().required(), // 'personal' | 'work'
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
