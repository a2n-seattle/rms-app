import { PreSignUpExternalProviderTriggerEvent } from "aws-lambda"
import { handler } from "../../../../src/handlers/auth/PreSignUp"

function buildEvent(userAttributes: { [key: string]: string }): PreSignUpExternalProviderTriggerEvent {
    return {
        triggerSource: "PreSignUp_ExternalProvider",
        request: { userAttributes },
        response: { autoConfirmUser: false, autoVerifyEmail: false, autoVerifyPhone: false },
    } as PreSignUpExternalProviderTriggerEvent
}

test('will allow sign-up when email domain matches acts2.network', async () => {
    const event = buildEvent({ email: "jane@acts2.network" })

    await expect(handler(event, null as any, null as any)).resolves.toEqual(event)
})

test('will reject sign-up when email domain is different', async () => {
    const event = buildEvent({ email: "jane@gmail.com" })

    await expect(handler(event, null as any, null as any)).rejects.toThrow(
        "Sign-up restricted to acts2.network Google Workspace accounts"
    )
})

test('will reject sign-up when email is missing entirely', async () => {
    const event = buildEvent({})

    await expect(handler(event, null as any, null as any)).rejects.toThrow(
        "Sign-up restricted to acts2.network Google Workspace accounts"
    )
})
