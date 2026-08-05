import { CognitoIdentityProviderClient, ListUsersCommand, UserType } from "@aws-sdk/client-cognito-identity-provider"
import { DirectoryUser, UserDirectoryClient } from "./UserDirectoryClient"

/**
 * Real Cognito-backed implementation. Requires `cognito-idp:ListUsers` on the target user
 * pool's ARN, granted to whichever Lambda constructs this (see amplify/functions/apiFunction.ts
 * for the grant pattern already used for DynamoDB table access).
 */
export class CognitoUserDirectoryClient implements UserDirectoryClient {
    private readonly client: CognitoIdentityProviderClient
    private readonly userPoolId: string

    public constructor(userPoolId: string) {
        this.client = new CognitoIdentityProviderClient({})
        this.userPoolId = userPoolId
    }

    public findByEmail(email: string): Promise<DirectoryUser | undefined> {
        const escaped = email.replace(/"/g, '\\"')
        return this.client.send(new ListUsersCommand({
            UserPoolId: this.userPoolId,
            Filter: `email = "${escaped}"`,
            Limit: 1
        })).then((output) => this.toDirectoryUser(output.Users?.[0]))
    }

    public findBySub(sub: string): Promise<DirectoryUser | undefined> {
        const escaped = sub.replace(/"/g, '\\"')
        return this.client.send(new ListUsersCommand({
            UserPoolId: this.userPoolId,
            Filter: `sub = "${escaped}"`,
            Limit: 1
        })).then((output) => this.toDirectoryUser(output.Users?.[0]))
    }

    private toDirectoryUser(user?: UserType): DirectoryUser | undefined {
        if (!user) {
            return undefined
        }
        const attr = (name: string) => user.Attributes?.find((a) => a.Name === name)?.Value
        const sub = attr("sub")
        if (!sub) {
            return undefined
        }
        return { sub, email: attr("email"), name: attr("name") }
    }
}
