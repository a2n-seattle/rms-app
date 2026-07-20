import { defineAuth } from "@aws-amplify/backend"

/**
 * Fresh Cognito User Pool, replacing the Gen 1 pool
 * (amplify/backend/auth/rms42689182), which was deleted from the alpha
 * account with no users left to preserve — referenceAuth no longer applies,
 * so this defines a brand new pool instead of pointing at an old one.
 *
 * Mirrors the Gen 1 config from
 * amplify/backend/auth/rms42689182/cli-inputs.json as closely as Gen 2's
 * API allows: email/password login, email + name required attributes,
 * MFA off. Since this is a fresh pool, all users will need to sign up
 * again — there is no data to migrate.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    userAttributes: {
        fullname: {
            required: true,
        },
    },
    multifactor: {
        mode: "OFF",
    },
})
