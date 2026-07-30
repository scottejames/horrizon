import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Task/Project/AreaOfResponsibility schema, backed by DynamoDB via AppSync.
 *
 * `priority`, `horizon`, and `state` are plain strings rather than GraphQL
 * enums: their accepted values are expected to evolve (see
 * CODING_GUIDELINES.md #5), and an enum member can't be renamed without a
 * breaking schema change.
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
      deferredFrom: a.string(), // horizon this task was deferred from, set only while state === 'deferred'
      projectId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  Project: a
    .model({
      shortCode: a.string().required(),
      name: a.string().required(),
      areaId: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  AreaOfResponsibility: a
    .model({
      name: a.string().required(),
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
