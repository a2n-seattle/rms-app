import { PreSignUpTriggerHandler } from "aws-lambda"

const ALLOWED_EMAIL_DOMAIN = "acts2.network"

export const handler: PreSignUpTriggerHandler = async (event) => {
    if (event.triggerSource === "PreSignUp_ExternalProvider") {
        const email = event.request.userAttributes.email
        const domain = email?.split("@")[1]
        if (domain !== ALLOWED_EMAIL_DOMAIN) {
            throw new Error(`Sign-up restricted to ${ALLOWED_EMAIL_DOMAIN} Google Workspace accounts`)
        }
    }

    return event
}
