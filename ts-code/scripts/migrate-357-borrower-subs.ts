/**
 * One-off backfill for GH-357: resolves pre-existing `ItemsSchema.borrower` and
 * `ScheduleSchema.borrower` values that are still emails (from before GH-353 switched
 * `borrower` to the Cognito `sub`) against the Cognito user pool, and rewrites them to the
 * resolved `sub`. Without this, an item/reservation borrowed before GH-353 shipped never
 * shows up in that borrower's dashboard, since the dashboard now queries by `sub`.
 *
 * NOT part of the Lambda build, NOT wired into CI -- run manually once, against `alpha`,
 * right after this PR's backend-cd.yml deploy completes:
 *
 *   AWS_PROFILE=rms-alpha node ts-output/scripts/migrate-357-borrower-subs.js
 *
 * Safe to re-run: a `borrower` value without "@" (already a sub, or never set) is skipped.
 */
import {
    DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient, ScanCommand, UpdateCommand,
} from "@aws-sdk/lib-dynamodb"
import { CognitoUserDirectoryClient } from "../src/injection/cognito/CognitoUserDirectoryClient"

const REGION = "us-west-2"
const ITEMS_TABLE = "items-alpha"
const SCHEDULE_TABLE = "schedule-alpha"

// These tables are provisioned at 1 RCU/1 WCU -- pace every write.
const WRITE_DELAY_MS = 1100

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function paced<T>(fn: () => Promise<T>): Promise<T> {
    await sleep(WRITE_DELAY_MS)
    return fn()
}

async function scanAll(tableName: string): Promise<Record<string, any>[]> {
    const items: Record<string, any>[] = []
    let ExclusiveStartKey: Record<string, any> | undefined
    do {
        const output = await client.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }))
        items.push(...(output.Items ?? []))
        ExclusiveStartKey = output.LastEvaluatedKey
    } while (ExclusiveStartKey)
    return items
}

async function backfillBorrower(tableName: string, directory: CognitoUserDirectoryClient): Promise<void> {
    const rows = await scanAll(tableName)

    for (const row of rows) {
        const borrower: string | undefined = row.borrower
        if (!borrower || !borrower.includes("@")) {
            // Already a sub (or blank/available) -- nothing to do.
            continue
        }

        const user = await directory.findByEmail(borrower)
        if (!user) {
            console.warn(`${tableName} ${row.id}: no Cognito user found for email '${borrower}', leaving as-is`)
            continue
        }

        await paced(() => client.send(new UpdateCommand({
            TableName: tableName,
            Key: { id: row.id },
            UpdateExpression: "SET borrower = :sub",
            ExpressionAttributeValues: { ":sub": user.sub },
        })))
        console.log(`${tableName} ${row.id}: borrower ${borrower} -> ${user.sub}`)
    }
}

async function main(): Promise<void> {
    const userPoolId = process.env.AUTH_USER_POOL_ID
    if (!userPoolId) {
        throw new Error("AUTH_USER_POOL_ID env var is required (the alpha Cognito user pool id)")
    }
    const directory = new CognitoUserDirectoryClient(userPoolId)

    await backfillBorrower(ITEMS_TABLE, directory)
    await backfillBorrower(SCHEDULE_TABLE, directory)
    console.log("Backfill complete.")
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
