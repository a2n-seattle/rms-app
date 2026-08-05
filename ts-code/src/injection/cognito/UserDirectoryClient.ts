/**
 * A resolved Cognito user's identity/display attributes.
 */
export interface DirectoryUser {
    sub: string
    email?: string
    name?: string
}

/**
 * Lookup against the Cognito user pool backing this app's auth. Used to (a) resolve a
 * free-text `owner` string to a real user's `sub` at item-creation time, and (b) resolve a
 * `sub`/email back to a display name for presentation (ListHistory, item/dashboard views).
 */
export interface UserDirectoryClient {
    /**
     * Finds a user by email (case-sensitive exact match, matching Cognito's own email
     * uniqueness constraint). Returns undefined if no user matches.
     */
    findByEmail(email: string): Promise<DirectoryUser | undefined>;

    /**
     * Finds a user by Cognito `sub`. Returns undefined if no user matches.
     */
    findBySub(sub: string): Promise<DirectoryUser | undefined>;
}
