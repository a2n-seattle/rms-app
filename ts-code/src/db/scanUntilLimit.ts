import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"
import { DBClient } from "../injection/db/DBClient"
import { encodePageToken } from "./PageToken"

/**
 * DynamoDB's `Scan` `Limit` bounds items *scanned*, not items matching a `FilterExpression` --
 * a page can scan `Limit` non-matching items and return few/no matches while
 * `LastEvaluatedKey` is still set, meaning real matches remain further on. Every `List*`
 * class in this repo used to do a single `client.scan(params)` call and hand that short page
 * straight back, silently dropping matches beyond the first page -- callers (the dashboard)
 * never followed `nextPageToken`. This loops internally so a single call reliably returns up
 * to `limit` real matches (or exhausts the table), while keeping the same
 * `{ items, nextPageToken }` contract every caller already expects.
 */
export function scanUntilLimit<T>(
    client: DBClient,
    baseParams: ScanCommandInput,
    limit: number,
    predicate?: (item: T) => Promise<boolean> | boolean
): Promise<{ items: T[], nextPageToken?: string }> {
    const matches: T[] = []

    const step = (exclusiveStartKey?: Record<string, any>): Promise<{ items: T[], nextPageToken?: string }> => {
        const params: ScanCommandInput = {
            ...baseParams,
            ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {})
        }

        return client.scan(params).then((output: ScanCommandOutput) => {
            const scanned = (output.Items ?? []) as T[]
            return Promise.all(scanned.map((item) => predicate ? predicate(item) : true))
                .then((keep: boolean[]) => {
                    scanned.forEach((item, i) => {
                        if (keep[i]) {
                            matches.push(item)
                        }
                    })

                    if (matches.length >= limit) {
                        const excess = matches.length - limit
                        const page = excess > 0 ? matches.slice(0, limit) : matches
                        // Excess matches found within this same scanned page are simply
                        // dropped rather than tracked for a resumable token -- DynamoDB's
                        // LastEvaluatedKey only identifies a position between pages, not
                        // within one, so precise resumption mid-page isn't possible here.
                        return { items: page, nextPageToken: output.LastEvaluatedKey ? encodePageToken(output.LastEvaluatedKey) : undefined }
                    }

                    if (!output.LastEvaluatedKey) {
                        return { items: matches, nextPageToken: undefined }
                    }

                    return step(output.LastEvaluatedKey)
                })
        })
    }

    return step(baseParams.ExclusiveStartKey)
}
