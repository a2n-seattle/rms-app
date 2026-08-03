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
 * Google federation is restricted to acts2.network Workspace accounts:
 * Google's own OIDC docs require the relying party to check the signed
 * `hd` claim server-side (Google Cloud Console's "Internal" app-type
 * restriction alone isn't reliable across orgs), so the actual
 * enforcement is the preSignUp trigger below, not anything on the
 * Google side. clientId/clientSecret reference Amplify secrets (set via
 * `ampx sandbox secret set GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) --
 * real values are provided out of band, not committed here.
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
                attributeMapping: {
                    custom: {
                        hd: "hd",
                    },
                },
            },
            callbackUrls: ["http://localhost:3000/callback"],
            logoutUrls: ["http://localhost:3000/"],
        },
    },
    userAttributes: {
        fullname: {
            required: true,
        },
        "custom:hd": {
            dataType: "String",
            mutable: true,
            maxLen: 253,
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
