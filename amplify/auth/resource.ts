import { defineAuth } from "@aws-amplify/backend";

/**
 * Cognito user pool. Email + password is the only sign-in method for V0 —
 * this is a single-user planning tool, not a multi-tenant product, so there's
 * no social-provider or MFA requirement yet.
 * https://docs.amplify.aws/react/build-a-backend/auth/set-up-auth/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
