import { PreSignUpExternalProviderTriggerEvent } from "aws-lambda"
import { handler } from "../../../../src/handlers/auth/PreSignUp"

function buildEvent(userAttributes: { [key: string]: string }): PreSignUpExternalProviderTriggerEvent {
    return {
        triggerSource: "PreSignUp_ExternalProvider",
        request: { userAttributes },
        response: { autoConfirmUser: false, autoVerifyEmail: false, autoVerifyPhone: false },
    } as PreSignUpExternalProviderTriggerEvent
}

test('will allow sign-up when hd claim matches acts2.network', async () => {
    const event = buildEvent({ "custom:hd": "acts2.network" })

    await expect(handler(event, null as any, null as any)).resolves.toEqual(event)
})

test('will reject sign-up when hd claim is a different domain', async () => {
    const event = buildEvent({ "custom:hd": "gmail.com" })

    await expect(handler(event, null as any, null as any)).rejects.toThrow(
        "Sign-up restricted to acts2.network Google Workspace accounts"
    )
})

test('will reject sign-up when hd claim is missing entirely', async () => {
    const event = buildEvent({})

    await expect(handler(event, null as any, null as any)).rejects.toThrow(
        "Sign-up restricted to acts2.network Google Workspace accounts"
    )
})
