import { referenceAuth } from "@aws-amplify/backend"

/**
 * References the existing Gen 1 Cognito User Pool + Identity Pool
 * (amplify/backend/auth/rms42689182) rather than migrating/recreating them.
 * Zero user-data risk: the pool is treated as unmanaged external
 * infrastructure Gen 2 can grant permissions to, never modified.
 *
 * The Identity Pool is kept referenced (not dropped) — see the migration
 * plan's auth section for why: the integration test and possibly the
 * current frontend still depend on its authenticated role for direct
 * Lambda invocation. Retiring it is separate follow-up work.
 *
 * TODO: replace the REPLACE_WITH_* placeholders with the real values from
 * the alpha CloudFormation stack (amplify-rms-alpha-233046) before any
 * sandbox deploy that needs real auth (Phase 1 of the migration plan).
 */
export const auth = referenceAuth({
    userPoolId: "REPLACE_WITH_USER_POOL_ID",
    identityPoolId: "REPLACE_WITH_IDENTITY_POOL_ID",
    userPoolClientId: "REPLACE_WITH_USER_POOL_CLIENT_ID",
    authRoleArn: "arn:aws:iam::801118485191:role/amplify-rms-alpha-233046-authRole",
    unauthRoleArn: "arn:aws:iam::801118485191:role/amplify-rms-alpha-233046-unauthRole",
})
