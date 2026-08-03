/**
 * Opaque base64 encoding of a DynamoDB ExclusiveStartKey/LastEvaluatedKey,
 * shared by every paginated Scan-based list method (ScheduleTable,
 * MainTable) so callers pass an opaque string rather than a raw DynamoDB
 * key shape.
 */
export function encodePageToken(lastEvaluatedKey: Record<string, any>): string {
    return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64")
}

export function decodePageToken(pageToken: string): Record<string, any> {
    return JSON.parse(Buffer.from(pageToken, "base64").toString("utf-8"))
}
