import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

/**
 * Every model in amplify/data/resource.ts uses `allow.owner()`. The generated
 * client's default authMode otherwise follows the schema's
 * `defaultAuthorizationMode`, not any specific model's own rule — so
 * `authMode` is set explicitly here rather than left implicit, to avoid a
 * silent "Not Authorized" from a call that looks fine in the UI.
 */
export const client = generateClient<Schema>({ authMode: "userPool" });
