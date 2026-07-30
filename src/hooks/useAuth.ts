import { useAuthenticator } from "@aws-amplify/ui-react";

/**
 * Thin wrapper over Amplify UI's auth context so components depend on this
 * hook, never on `@aws-amplify/ui-react` directly (CODING_GUIDELINES.md #2,
 * Dependency Inversion).
 */
export function useAuth() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  return { user, signOut };
}
