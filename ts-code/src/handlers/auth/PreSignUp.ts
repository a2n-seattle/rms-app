import { PreSignUpTriggerHandler } from "aws-lambda"

const ALLOWED_HOSTED_DOMAIN = "acts2.network"

export const handler: PreSignUpTriggerHandler = async (event) => {
    if (event.triggerSource === "PreSignUp_ExternalProvider") {
        const hostedDomain = event.request.userAttributes["custom:hd"]
        if (hostedDomain !== ALLOWED_HOSTED_DOMAIN) {
            throw new Error(`Sign-up restricted to ${ALLOWED_HOSTED_DOMAIN} Google Workspace accounts`)
        }
    }

    return event
}
