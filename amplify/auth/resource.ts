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
 * `fullname` still needs an explicit attributeMapping to Google's "name"
 * claim: Amplify only auto-maps `email`, and this pool requires
 * `fullname` (below) -- omitting it fails at deploy time with "The
 * attribute mapping is missing required attributes [name]" (verified
 * against a real deploy), since Cognito can't populate a required
 * attribute for a federated sign-up with no mapped source.
 *
 * clientId/clientSecret reference Amplify secrets (set via the Amplify
 * Console's per-branch secrets, or SSM directly at
 * /amplify/<app-id>/<branch>-branch-<hash>/<name> for branches without
 * a connected Hosting repo) -- real values are provided out of band,
 * not committed here.
 *
 * callbackUrls/logoutUrls point at /login, not a dedicated /callback
 * route -- web/'s login page (GH-306) uses @aws-amplify/ui-react's
 * <Authenticator> (with socialProviders: ["google"]), which handles the
 * OAuth code exchange client-side via URL params on whatever page it
 * lands on; no server route needs to parse the code itself. /login is
 * used specifically because it's the one path proxy.ts's matcher
 * excludes from the auth gate -- any other path would redirect
 * unauthenticated requests straight to /login before Amplify's
 * client-side listener ever got to process Google's ?code=... param,
 * breaking the sign-in flow. Includes both the deployed alpha URL and
 * localhost:3000 (for local dev); append further URLs the same way as
 * new environments/branches come online, no redeploy dance needed since
 * these are plain arrays.
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
                attributeMapping: {
                    fullname: "name",
                },
            },
            callbackUrls: ["https://alpha.d2t4r8ycfq1um5.amplifyapp.com/login", "http://localhost:3000/login"],
            logoutUrls: ["https://alpha.d2t4r8ycfq1um5.amplifyapp.com/", "http://localhost:3000/"],
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
