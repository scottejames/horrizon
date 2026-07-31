import { useAuthenticator } from "@aws-amplify/ui-react";

/**
 * Only this account can ever enter debug mode (see App.tsx and
 * design/design-principles.md's debug-mode entry for what that does and
 * doesn't guarantee) — this is a convenience gate for the owner's own
 * testing tools, not a security boundary; every debug action still only
 * ever touches that signed-in user's own owner-scoped data regardless.
 */
const DEBUG_ELIGIBLE_EMAIL = "scottejames@gmail.com";

/**
 * Thin wrapper over Amplify UI's auth context so components depend on this
 * hook, never on `@aws-amplify/ui-react` directly (CODING_GUIDELINES.md #2,
 * Dependency Inversion).
 */
export function useAuth() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const isDebugEligible = user?.signInDetails?.loginId?.toLowerCase() === DEBUG_ELIGIBLE_EMAIL;
  return { user, signOut, isDebugEligible };
}
