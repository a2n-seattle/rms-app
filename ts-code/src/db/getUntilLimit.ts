import { encodePageToken, decodePageToken } from "./PageToken"

/**
 * Walks a bounded list of ids (e.g. UserTable's owned/reserved/borrowed/history arrays),
 * fetching each one and applying an optional predicate, collecting matches until `limit` is
 * reached or `ids` is exhausted -- the id-array equivalent of scanUntilLimit.ts's "loop until
 * N real matches" contract, so callers switching from a table Scan to this don't lose that
 * guarantee. A `getById` result of `undefined` (a stale array entry pointing at a
 * since-deleted row) is treated as no-match and skipped rather than surfaced as a hole.
 */
export function getUntilLimit<T>(
    ids: string[],
    getById: (id: string) => Promise<T | undefined>,
    limit: number,
    pageToken?: string,
    predicate?: (item: T) => Promise<boolean> | boolean
): Promise<{ items: T[], nextPageToken?: string }> {
    const startOffset: number = pageToken ? decodePageToken(pageToken).offset : 0
    const matches: T[] = []

    const step = (offset: number): Promise<{ items: T[], nextPageToken?: string }> => {
        if (matches.length >= limit || offset >= ids.length) {
            return Promise.resolve({
                items: matches,
                nextPageToken: offset < ids.length ? encodePageToken({ offset }) : undefined
            })
        }

        return getById(ids[offset]).then((item) => {
            if (!item) {
                return step(offset + 1)
            }
            return Promise.resolve(predicate ? predicate(item) : true).then((keep) => {
                if (keep) {
                    matches.push(item)
                }
                return step(offset + 1)
            })
        })
    }

    return step(startOffset)
}
