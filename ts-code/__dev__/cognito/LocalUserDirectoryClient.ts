import { DirectoryUser, UserDirectoryClient } from "../../src/injection/cognito/UserDirectoryClient"

/**
 * In-memory UserDirectoryClient for tests -- seeded with a fixed list of users rather than
 * hitting a real Cognito pool, mirroring LocalDBClient's role for DBClient.
 */
export class LocalUserDirectoryClient implements UserDirectoryClient {
    private readonly users: DirectoryUser[]

    public constructor(users: DirectoryUser[] = []) {
        this.users = users
    }

    public findByEmail(email: string): Promise<DirectoryUser | undefined> {
        return Promise.resolve(this.users.find((u) => u.email === email))
    }

    public findBySub(sub: string): Promise<DirectoryUser | undefined> {
        return Promise.resolve(this.users.find((u) => u.sub === sub))
    }
}
