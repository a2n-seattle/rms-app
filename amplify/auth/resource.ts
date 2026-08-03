import { defineAuth, defineFunction, secret } from "@aws-amplify/backend"
import { definePreSignUpFunction } from "../functions/pre-sign-up/resource"

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
 *
 * Google federation is restricted to acts2.network Workspace accounts.
 * Google's `hd` (hosted domain) claim only exists on the raw ID token --
 * Cognito's Google IdP integration fetches user info via Google's People
 * API instead (confirmed via its ProviderDetails.attributes_url), which
 * doesn't expose `hd` at all, so it can't be used as an attributeMapping
 * source (verified against a real deploy: Cognito rejects it outright
 * with "AttributeMapping contains invalid mapping: [hd]"). The
 * documented, working alternative (AWS's own Pre Sign-up trigger docs,
 * and the common "Google Sign-In with an allowlist" pattern) is to
 * check the mapped `email` attribute's domain suffix instead -- `email`
 * is a real People API field and needs no custom attribute or extra
 * mapping: with loginWith.email enabled and no phone login, Amplify's
 * defineAuth automatically maps Google's email to the standard `email`
 * attribute already. See ts-code/src/handlers/auth/PreSignUp.ts.
 *
 * clientId/clientSecret reference Amplify secrets (set via the Amplify
 * Console's per-branch secrets, or SSM directly at
 * /amplify/<app-id>/<branch>-branch-<hash>/<name> for branches without
 * a connected Hosting repo) -- real values are provided out of band,
 * not committed here.
 *
 * callbackUrls/logoutUrls are localhost:3000 placeholders until the
 * web/ frontend (#303) exists and is deployed -- append the real prod
 * URL then, no redeploy dance needed since these are plain arrays.
 * domainPrefix isn't exposed at the defineAuth factory layer in this
 * Amplify version (confirmed via the installed package's own types --
 * ExternalProviderGeneralFactoryProps explicitly omits it, and
 * AmplifyAuthProps never re-adds it) -- Amplify computes the Hosted UI
 * domain prefix automatically, so no need to set it here.
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
        externalProviders: {
            google: {
                clientId: secret("GOOGLE_CLIENT_ID"),
                clientSecret: secret("GOOGLE_CLIENT_SECRET"),
            },
            callbackUrls: ["http://localhost:3000/callback"],
            logoutUrls: ["http://localhost:3000/"],
        },
    },
    userAttributes: {
        fullname: {
            required: true,
        },
    },
    multifactor: {
        mode: "OFF",
    },
    triggers: {
        preSignUp: defineFunction(
            (scope) => definePreSignUpFunction(scope),
            { resourceGroupName: "auth" }
        ),
    },
})
